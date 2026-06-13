package services

import (
	"context"
	"errors"

	"github.com/devyarustagi/Politique/internal/db"
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
	err = qtx.SetInBattle(ctx,uid)
	if err != nil {
		return uuid.Nil, err
	}
	return opponentUID, tx.Commit(ctx)

}