-- name: GetUserArmy :many
SELECT mercenary_id, count 
FROM user_army 
WHERE user_army.user_id = $1
ORDER BY mercenary_id ASC;

-- name: GetUserArmyCapacity :one
WITH UserMercCamps AS (
    SELECT building_id FROM 
    village_layout JOIN buildings_master_table ON village_layout.type_id = buildings_master_table.building_id
    WHERE building_name = 'Mercenary-Camp' AND user_id = $1
)
SELECT SUM(storage_capacity) ::SMALLINT AS capacity FROM
storages s JOIN UserMercCamps u ON s.building_id = u.building_id ;

-- name: DeleteUserArmy :exec
DELETE FROM user_army 
WHERE user_id = $1;

-- name: InsertArmyRow :exec
INSERT INTO user_army (user_id, mercenary_id, count)
VALUES ($1, $2, $3);


