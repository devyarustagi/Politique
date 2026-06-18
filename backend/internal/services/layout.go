package services

import (
	"context"
	"errors"
	"log"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNoBuilding        = errors.New("building does not exist")
	ErrInvalidPos        = errors.New("invalid position for building")
	ErrInvalidResource   = errors.New("invalid resource type")
	ErrBuildingLocked    = errors.New("building is not unlocked")
	ErrWrongLevel        = errors.New("building level cannot be more than one")
	ErrInsufficientFunds = errors.New("insufficient funds for the purchase")
)

func MoveBuiliding(ctx context.Context, q *db.Queries, building *dtors.MoveBuildingInfo, uid uuid.UUID) error {
	typeID, err := q.GetBuildingType(ctx, db.GetBuildingTypeParams{
		GlobalID: building.GlobalId,
		UserID:   uid,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNoBuilding
	}
	if err != nil {
		return err
	}
	// the x and y coordinates represent the coordinates of the top left corner of the space occupied by the building
	if !ValidateCoordBounds(int(building.XCoordinate), int(building.YCoordinate), int(config.BMT[typeID-1].TileCount)) {
		return ErrInvalidPos
	}
	var occupied []db.GetOccupiedPositionsRow
	occupied, err = q.GetOccupiedPositions(ctx, db.GetOccupiedPositionsParams{
		UserID:   uid,
		GlobalID: building.GlobalId,
	})
	if err != nil {
		return err
	}
	if !CheckCollisions(config.BMT[typeID-1].TileCount, building.XCoordinate, building.YCoordinate, occupied) {
		return ErrInvalidPos
	}
	return q.UpdateBuildingPosition(ctx, db.UpdateBuildingPositionParams{
		XCoordinate: building.XCoordinate,
		YCoordinate: building.YCoordinate,
		GlobalID:    building.GlobalId,
	})
}

func NewBuilding(ctx context.Context, p *pgxpool.Pool, building *dtors.NewBuildingInfo, uid uuid.UUID) (int64, error) {
	q := db.New(p)
	if !(building.Resource == "oil" || building.Resource == "gems") {
		return 0, ErrInvalidResource
	}
	if int(building.TypeID) > len(config.BMT) || building.TypeID < 1 {
		log.Printf("%v", building.TypeID);
		return 0, ErrNoBuilding
	}
	if !ValidateCoordBounds(int(building.XCoordinate), int(building.YCoordinate), int(config.BMT[building.TypeID-1].TileCount)) {
		return 0, ErrInvalidPos
	}
	var residence db.GetUserResidenceLvlandResourcesRow
	residence, err := q.GetUserResidenceLvlandResources(ctx, uid)
	if err != nil {
		return 0, err
	}
	var buildingInfo db.BuildingsMasterTable
	buildingInfo = config.BMT[building.TypeID-1]
	if buildingInfo.UnlockLevel > residence.ResidenceLevel {
		return 0, ErrBuildingLocked
	}
	if buildingInfo.BuildingLevel != 1 {
		return 0, ErrWrongLevel
	}
	if building.Resource == "gems" {
		if buildingInfo.UpgradeCost/100 > residence.Gems {
			return 0, ErrInsufficientFunds
		}
	} else {
		if buildingInfo.UpgradeCost > residence.Oil {
			return 0, ErrInsufficientFunds
		}
	}	
	tx, err := p.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	var occupied []db.GetOccupiedPositionsRow
	occupied, err = qtx.GetOccupiedPositions(ctx, db.GetOccupiedPositionsParams{
		UserID:   uid,
		GlobalID: 0,
	})
	if err != nil {
		return 0, err
	}
	if !CheckCollisions(buildingInfo.TileCount, building.XCoordinate, building.YCoordinate, occupied) {
		return 0, ErrInvalidPos
	}
	if building.Resource == "oil" {
		if err := qtx.SpendOil(ctx, db.SpendOilParams{
			UserID: uid,
			Oil:    buildingInfo.UpgradeCost,
		}); err != nil {
			return 0, err
		}
	} else {
		if err := qtx.SpendGems(ctx, db.SpendGemsParams{
			UserID: uid,
			Gems:   buildingInfo.UpgradeCost / 100,
		}); err != nil {
			return 0, err
		}
	}
	globalID, err := qtx.AddBuilding(ctx, db.AddBuildingParams{
		UserID:      uid,
		TypeID:      building.TypeID,
		XCoordinate: building.XCoordinate,
		YCoordinate: building.YCoordinate,
	})
	if err != nil {
		return 0, err
	}
	return globalID, tx.Commit(ctx)
}

func UpgradeBuilding(ctx context.Context, p *pgxpool.Pool, upgradeInfo *dtors.UpgradeBuildingInfo, uid uuid.UUID) error {
	q := db.New(p)
	if !(upgradeInfo.Resource == "oil" || upgradeInfo.Resource == "gems") {
		return ErrInvalidResource
	}
	var typeID int16
	var err error
	if typeID, err = q.GetBuildingType(ctx, db.GetBuildingTypeParams{
		GlobalID: upgradeInfo.GlobalID,
		UserID:   uid,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNoBuilding
		} else {
			return err
		}
	}
	if int(typeID) > len(config.BMT) || typeID < 1 || config.BMT[typeID-1].UnlockLevel == config.MaxResidenceLvl{
		//third check to see whether any more levels for the building exist or not
		//safe to put third check in the last because || operator short circuits so never evaluated in case of OOB access attempts
		return ErrNoBuilding
	}
	var residence db.GetUserResidenceLvlandResourcesRow
	residence, err = q.GetUserResidenceLvlandResources(ctx, uid)
	if err != nil {
		return err
	}
	newLevelInfo:= config.BMT[typeID] //fetch info about next level, typeID is 1-indexed so BMT[typeID] = next level
	if newLevelInfo.UnlockLevel > residence.ResidenceLevel {
		return ErrBuildingLocked
	}
	if upgradeInfo.Resource == "gems" {
		if newLevelInfo.UpgradeCost/100 > residence.Gems {
			return ErrInsufficientFunds
		}
	} else {
		if newLevelInfo.UpgradeCost > residence.Oil {
			return ErrInsufficientFunds
		}
	}
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	if upgradeInfo.Resource == "oil" {
		if err := qtx.SpendOil(ctx, db.SpendOilParams{
			UserID: uid,
			Oil:    newLevelInfo.UpgradeCost,
		}); err != nil {
			return err
		}
	} else {
		if err := qtx.SpendGems(ctx, db.SpendGemsParams{
			UserID: uid,
			Gems:   newLevelInfo.UpgradeCost / 100,
		}); err != nil {
			return err
		}
	}
	err = qtx.UpgradeBuilding(ctx, upgradeInfo.GlobalID)
	if err != nil {
		return err
	}
	if config.BMT[typeID].BuildingName == "Residence"{
		err = qtx.UpgradeResidence(ctx, uid);
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func CheckCollisions(sz int16, x int16, y int16, occupied []db.GetOccupiedPositionsRow) bool {
	for _, building := range occupied {
		xOverlap := x < building.XCoordinate+building.TileCount &&
			x+sz > building.XCoordinate
		yOverlap := y < building.YCoordinate+building.TileCount &&
			y+sz > building.YCoordinate

		if xOverlap && yOverlap {
			return false
		}
	}
	return true
}
func ValidateCoordBounds(x int, y int, sz int) bool {
	if x < 0 ||
		y < 0 ||
		x > (int(config.MapSize)-sz) ||
		y > (int(config.MapSize)-sz) {
		return false
	}
	return true
}
