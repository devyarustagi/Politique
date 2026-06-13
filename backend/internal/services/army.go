package services

import (
	"context"
	"errors"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

var (
	ErrInvalidMercID = errors.New("invalid mercenary id")
	ErrMercNotOwned  = errors.New("mercenary not owned")
	ErrMercCapacity  = errors.New("insufficient mercenary capacity")
)

func UpdateUserArmy(uid uuid.UUID, req []db.GetUserArmyRow, p *pgxpool.Pool, ctx context.Context) error {
	q := db.New(p)
	g, ctx2 := errgroup.WithContext(ctx)
	var capacity, residenceLevel int16
	g.Go(func() error {
		var err error
		capacity, err = q.GetUserArmyCapacity(ctx2, uid)
		return err
	})
	g.Go(func() error {
		var err error
		residenceLevel, err = q.GetUserResidenceLevel(ctx2, uid)
		return err
	})
	err := g.Wait()
	if err != nil {
		return err
	}
	var sum int16 = 0
	for _, merc := range req {
		if int(merc.MercenaryID) > len(config.Mercs) || merc.MercenaryID < 1 {
			return ErrInvalidMercID
		}
		if residenceLevel != config.Mercs[merc.MercenaryID-1].UnlockLevel {
			return ErrMercNotOwned
		}
		sum += merc.Count
		if sum > capacity {
			//do the check inside the loop instead of outside it because a miscreant might
			// send too many mercs/huge values for the counts which can cause integer overflows
			return ErrMercCapacity
		}
	}
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := q.WithTx(tx)

	if err := qtx.DeleteUserArmy(ctx, uid); err != nil {
		return err
	}

	for _, merc := range req {
		if err := qtx.InsertArmyRow(ctx, db.InsertArmyRowParams{
			UserID:      uid,
			MercenaryID: merc.MercenaryID,
			Count:       merc.Count,
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)

}
