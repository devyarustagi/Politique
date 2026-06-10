package services

import (
	"context"
	"errors"

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

func NewBuilding(ctx context.Context, p *pgxpool.Pool, building *dtors.NewBuildingInfo, uid uuid.UUID) error {
	q := db.New(p)
	if !(building.Resource == "oil" || building.Resource == "gems") {
		return ErrInvalidResource
	}
	if int(building.TypeID) > len(config.BMT) || building.TypeID < 1 {
		return ErrNoBuilding
	}
	if !ValidateCoordBounds(int(building.XCoordinate), int(building.YCoordinate), int(config.BMT[building.TypeID-1].TileCount)) {
		return ErrInvalidPos
	}
	var residence db.GetUserResidenceLvlandResourcesRow
	residence, err := q.GetUserResidenceLvlandResources(ctx, uid)
	if err != nil {
		return err
	}
	var buildingInfo db.BuildingsMasterTable
	buildingInfo = config.BMT[building.TypeID-1]
	if buildingInfo.UnlockLevel > residence.ResidenceLevel {
		return ErrBuildingLocked
	}
	if buildingInfo.BuildingLevel != 1 {
		return ErrWrongLevel
	}
	if building.Resource == "gems" {
		if buildingInfo.UpgradeCost/100 > residence.Gems {
			return ErrInsufficientFunds
		}
	} else {
		if buildingInfo.UpgradeCost > residence.Oil {
			return ErrInsufficientFunds
		}
	}
	tx, err := p.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := q.WithTx(tx)
	var occupied []db.GetOccupiedPositionsRow
	occupied, err = qtx.GetOccupiedPositions(ctx, db.GetOccupiedPositionsParams{
		UserID:   uid,
		GlobalID: 0,
	})
	if err != nil {
		return err
	}
	if !CheckCollisions(buildingInfo.TileCount, building.XCoordinate, building.YCoordinate, occupied) {
		return ErrInvalidPos
	}
	if building.Resource == "oil" {
		if err := qtx.SpendOil(ctx, db.SpendOilParams{
			UserID: uid,
			Oil:    buildingInfo.UpgradeCost,
		}); err != nil {
			return err
		}
	} else {
		if err := qtx.SpendGems(ctx, db.SpendGemsParams{
			UserID: uid,
			Gems:   buildingInfo.UpgradeCost / 100,
		}); err != nil {
			return err
		}
	}
	err = qtx.AddBuilding(ctx, db.AddBuildingParams{
		UserID: uid,
		TypeID: building.TypeID,
		XCoordinate: building.XCoordinate,
		YCoordinate: building.YCoordinate,
	})
	if err != nil {
		return err
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
