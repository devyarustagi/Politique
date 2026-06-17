package services

import (
	"context"
	"errors"

	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var(
	ErrInBattle = errors.New("user already in battle, cannot start another one simultaneously")
)

func Matchmake(ctx context.Context, p *pgxpool.Pool, uid uuid.UUID) (uuid.UUID, error) {
	q := db.New(p)
	userInfo, err:= q.GetUserInfoForMatchmaking(ctx, uid)
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
	opponentUID, err:= qtx.GetSuitableOpponent(ctx, db.GetSuitableOpponentParams{
		UserID: uid,
		Column2: userInfo.Karma,
		Column3: userInfo.ResidenceLevel,
	})
	if err != nil {
		return uuid.Nil, err
	}
	err = qtx.SetInBattle(ctx,db.SetInBattleParams{
		UserID: uid,
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
	opponentProfile, err:= qtx.GetDefenderNameKarma(ctx, opponentUID)
	if err != nil {
		return dtors.OpponentInfo{}, err
	}
	layout, err := qtx.GetDefenderVillageLayout(ctx, opponentUID)
	if err != nil {
		return dtors.OpponentInfo{}, err
	}
	return dtors.OpponentInfo{
		Name: opponentProfile.Username,
		Karma: opponentProfile.Karma,
		VillageLayout: layout,
	}, tx.Commit(ctx)

}