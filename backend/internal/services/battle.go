package services

import (
	"context"
	"errors"

	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInBattle = errors.New("user already in battle, cannot start another one simultaneously")
)

func Matchmake(ctx context.Context, p *pgxpool.Pool, uid uuid.UUID) (uuid.UUID, error) {
	q := db.New(p)
	userInfo, err := q.GetUserInfoForMatchmaking(ctx, uid)
	if err != nil {
		return uuid.Nil, err
	}
	if userInfo.InBattle {
		return uuid.Nil, ErrInBattle
	}

	tx, err := p.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	opponentUID, err := qtx.GetSuitableOpponent(ctx, db.GetSuitableOpponentParams{
		UserID:  uid,
		Column2: userInfo.Karma,
		Column3: userInfo.ResidenceLevel,
	})
	if err != nil {
		return uuid.Nil, err
	}
	err = qtx.SetInBattle(ctx, db.SetInBattleParams{
		UserID:      uid,
		AttackingOn: opponentUID,
	})
	if err != nil {
		return uuid.Nil, err
	}
	return opponentUID, tx.Commit(ctx)

}

func GetOpponentData(ctx context.Context, p *pgxpool.Pool, opponentUID uuid.UUID) (dtors.OpponentInfo, error) {
	q := db.New(p)
	tx, err := p.Begin(ctx)
	if err != nil {
		return dtors.OpponentInfo{}, err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	opponentProfile, err := qtx.GetDefenderNameKarma(ctx, opponentUID)
	if err != nil {
		return dtors.OpponentInfo{}, err
	}
	layout, err := qtx.GetDefenderVillageLayout(ctx, opponentUID)
	if err != nil {
		return dtors.OpponentInfo{}, err
	}
	return dtors.OpponentInfo{
		Name:          opponentProfile.Username,
		Karma:         opponentProfile.Karma,
		VillageLayout: layout,
	}, tx.Commit(ctx)

}

func FinishBattle(ctx context.Context, p *pgxpool.Pool, attackerUID uuid.UUID, result dtors.BattleResults) error {
	q := db.New(p)
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	opponentUID, err := qtx.GetDefenderUID(ctx, attackerUID)
	if err != nil {
		return err
	}
	err = qtx.UpdateAttackerResidence(ctx, db.UpdateAttackerResidenceParams{
		Oil:         result.OilLooted,
		AttackingOn: attackerUID,
	})
	if err != nil {
		return err
	}
	var attacksWon int32 = 0
	var defensesWon int32 = 1
	if result.KarmaGained > 0 {
		attacksWon = 1
		defensesWon = 0
	}
	err = qtx.UpdateAttackerStats(ctx, db.UpdateAttackerStatsParams{
		UserID:     attackerUID,
		AttacksWon: attacksWon,
		Karma:      int32(result.KarmaGained),
		OilLooted:  int64(result.OilLooted),
	})
	if err != nil {
		return err
	}
	err = qtx.UpdateDefenderResidence(ctx, opponentUID)
	if err != nil {
		return err
	}
	err = qtx.UpdateDefenderStats(ctx, db.UpdateDefenderStatsParams{
		UserID:      opponentUID,
		DefensesWon: defensesWon,
		Karma: -int32(result.KarmaGained),
	})
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}
