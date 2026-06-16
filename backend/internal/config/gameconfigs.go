package config

import (
	"context"
	"fmt"

	"github.com/devyarustagi/Politique/internal/db"
	"golang.org/x/sync/errgroup"
)

const MapSize int16 = 44 //side length of the square map
const MaxResidenceLvl int16 = 4
var BMT []db.BuildingsMasterTable //BMT = Buildings Master Table
var Defenses []db.Defense
var Storages []db.Storage
var Collectors []db.Collector
var Mercs []db.Mercenary
var Tiers []db.Tier


func LoadGameConfigs(q *db.Queries) error {
	grp, ctx := errgroup.WithContext(context.Background())
	grp.Go(func () error {
		var err error 
		BMT, err = q.Buildings(ctx)
		return err
	})
	grp.Go(func () error {
		var err error 
		Defenses, err = q.Defenses(ctx)
		return err
	})
	grp.Go(func () error {
		var err error 
		Storages, err = q.Storages(ctx)
		return err
	})
	grp.Go(func () error {
		var err error 
		Collectors, err = q.Collectors(ctx)
		return err
	})
	grp.Go(func () error {
		var err error 
		Mercs, err = q.Mercs(ctx)
		return err
	})
	grp.Go(func () error {
		var err error 
		Tiers, err = q.Tiers(ctx)
		return err
	})

	err := grp.Wait()
	if err != nil {
		err = fmt.Errorf("Error while loading game configs %w", err)
		return err
	}
	return nil
}