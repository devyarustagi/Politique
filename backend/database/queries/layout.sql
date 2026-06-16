-- name: GetBuildingType :one
SELECT type_id FROM village_layout WHERE global_id = $1 AND user_id = $2;

-- name: GetOccupiedPositions :many
SELECT tile_count, x_coordinate, y_coordinate FROM village_layout JOIN buildings_master_table
ON village_layout.type_id = buildings_master_table.building_id
WHERE user_id = $1 AND global_id != $2;

-- name: UpdateBuildingPosition :exec
UPDATE village_layout 
SET x_coordinate = $1, y_coordinate = $2
WHERE global_id = $3;

-- name: GetUserResidenceLvlandResources :one
SELECT residence_level, oil, gems FROM residence_properties WHERE user_id = $1;

-- name: AddBuilding :one
INSERT INTO village_layout (user_id, type_id, x_coordinate, y_coordinate)
VALUES ($1, $2, $3, $4)
RETURNING global_id;

-- name: UpgradeBuilding :exec
UPDATE village_layout
SET type_id = type_id + 1 WHERE global_id = $1;
