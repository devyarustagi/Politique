-- name: Buildings :many
SELECT * FROM buildings_master_table ORDER BY building_id ASC ;

-- name: Defenses :many
SELECT * FROM defenses ORDER BY building_id ASC;

-- name: Storages :many
SELECT * FROM storages ORDER BY building_id ASC;

-- name: Collectors :many
SELECT * FROM collectors ORDER BY building_id ASC;

-- name: Mercs :many
SELECT * FROM mercenaries ORDER BY mercenary_id ASC;

-- name: Tiers :many
SELECT * FROM tiers;