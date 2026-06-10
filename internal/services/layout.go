package services

import (
	"context"
	"errors"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrNoBuilding = errors.New("building does not exist")
	ErrInvalidPos = errors.New("invalid position for building")
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
	if building.XCoordinate < 0 ||
		building.YCoordinate < 0 ||
		building.XCoordinate > (config.MapSize-config.BMT[typeID-1].TileCount) ||
		building.YCoordinate > (config.MapSize-config.BMT[typeID-1].TileCount) {
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
	if !CheckPosition(config.BMT[typeID-1].TileCount, building.XCoordinate, building.YCoordinate, occupied) {
		return ErrInvalidPos
	}
	return q.UpdateBuildingPosition(ctx, db.UpdateBuildingPositionParams{
		XCoordinate: building.XCoordinate,
		YCoordinate: building.YCoordinate,
		GlobalID: building.GlobalId,
	})
}

func CheckPosition(sz int16, x int16, y int16, occupied []db.GetOccupiedPositionsRow) bool {
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
