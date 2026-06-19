package services

import (
	"context"
	"math"
	"time"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

func CollectResource(uid uuid.UUID, req dtors.CollectResourceInfo, p *pgxpool.Pool, ctx context.Context) (dtors.AmtCollected, error) {
	q:= db.New(p)
	if req.Resource == "oil" {
		g, ctx2 := errgroup.WithContext(ctx)
		var oilInfo db.GetUserOilAmtTzRow
		var layout []db.GetUserVillageLayoutRow
		g.Go(func() error {
			var err error
			oilInfo, err = q.GetUserOilAmtTz(ctx2, uid)
			return err
		})
		g.Go(func() error {
			var err error
			layout, err = q.GetUserVillageLayout(ctx2, uid)
			return err
		})
		err := g.Wait()
		if err != nil {
			return dtors.AmtCollected{Amount: 0}, err
		}
		netStorageCapacity:=0
		netProductionRate:=0
		netCollectorStorage:= 0
		for _, building:= range layout {
			info:= config.BMT[building.TypeID-1]
			if info.BuildingName == "Oil-Drill" {
				for _, collector:= range config.Collectors {
					if collector.BuildingID == building.TypeID {
						netProductionRate += int(collector.ProductionRate)
						netCollectorStorage += int(collector.StorageCapacity)
						break;
					}
				}
			} else if info.BuildingType == "storage" && info.BuildingName != "Mercenary-Camp" {
				for _, storage:= range config.Storages {
					if storage.BuildingID == building.TypeID {
						netStorageCapacity += int(storage.StorageCapacity)
						break;
					}
				}
			}
		}
		availableOil:= int(math.Round(time.Since(oilInfo.OilLastCollected).Hours() * float64(netProductionRate)))
		if availableOil > netCollectorStorage {
			availableOil = netCollectorStorage
		}
		storageUnoccpied := netStorageCapacity - int(oilInfo.Oil)
		var oilCollected int = 0
		var newCollectionTz time.Time;
		if storageUnoccpied >= availableOil {
			oilCollected = availableOil
			newCollectionTz = time.Now()
		} else {
			oilCollected = storageUnoccpied
			oilSurplus:= availableOil - oilCollected
			hoursAgo:= float64(oilSurplus) / float64(netProductionRate)
			newCollectionTz = time.Now().Add(-time.Duration(hoursAgo * float64(time.Hour)))
		}
		err = q.UpdataUserOilAmtTz(ctx, db.UpdataUserOilAmtTzParams{
			Oil: int32(oilCollected),
			OilLastCollected: newCollectionTz,
			UserID: uid,
		})
		if err != nil {
			return dtors.AmtCollected{Amount: 0}, err
		}
		return dtors.AmtCollected{Amount: int32(oilCollected)}, nil
	}else {
		g, ctx2 := errgroup.WithContext(ctx)
		var gemsTz time.Time
		var layout []db.GetUserVillageLayoutRow
		g.Go(func() error {
			var err error
			gemsTz, err = q.GetUserGemsTz(ctx2, uid)
			return err
		})
		g.Go(func() error {
			var err error
			layout, err = q.GetUserVillageLayout(ctx2, uid)
			return err
		})
		err := g.Wait()
		if err != nil {
			return dtors.AmtCollected{Amount: 0}, err
		}
		netProductionRate:= 0
		netCollectorStorage:= 0
		for _, building:= range layout {
			info:= config.BMT[building.TypeID-1]
			if info.BuildingName == "Gem-Mine" {
				for _, collector:= range config.Collectors {
					if collector.BuildingID == building.TypeID {
						netProductionRate += int(collector.ProductionRate)
						netCollectorStorage += int(collector.StorageCapacity)
						break;
					}
				}
			}
		}
		availableGems:= int(math.Round(time.Since(gemsTz).Hours() * float64(netProductionRate)))
		if availableGems > netCollectorStorage {
			availableGems = netCollectorStorage
		}
		err = q.UpdateUserGemsAmtTz(ctx, db.UpdateUserGemsAmtTzParams{
			Gems: int32(availableGems),
			GemsLastCollected: time.Now(),
			UserID: uid,
		})
		if err != nil {
			return dtors.AmtCollected{Amount: 0}, err
		}
		return dtors.AmtCollected{Amount: int32(availableGems)}, nil
	}
}