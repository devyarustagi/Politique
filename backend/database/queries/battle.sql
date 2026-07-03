-- name: GetUserInfoForMatchmaking :one
SELECT karma, residence_level, in_battle FROM 
user_stats JOIN residence_properties ON user_stats.user_id = residence_properties.user_id 
WHERE user_stats.user_id = $1;

-- name: GetSuitableOpponent :one
UPDATE residence_properties
SET under_attack = true
WHERE user_id = (
    SELECT user_stats.user_id FROM
    user_stats JOIN residence_properties ON user_stats.user_id = residence_properties.user_id
    WHERE 
    user_stats.user_id != $1
    AND karma BETWEEN $2 - 50 AND $2 + 50
    AND residence_level BETWEEN $3 - 1 AND $3 + 1
    AND under_attack = FALSE
    ORDER BY last_attacked ASC LIMIT 1
    FOR UPDATE SKIP LOCKED 
)
AND NOT EXISTS(
    SELECT 1 FROM residence_properties
    WHERE user_id = $1 AND in_battle = true
)
RETURNING user_id;

-- name: SetInBattle :exec
UPDATE residence_properties
SET in_battle = true, attacking_on = $2
WHERE user_id = $1;

-- name: GetDefenderInfo :one
SELECT username, karma, oil FROM creds 
JOIN user_stats 
ON creds.user_id = user_stats.user_id
JOIN residence_properties
ON user_stats.user_id = residence_properties.user_id
WHERE creds.user_id = $1;

-- name: GetDefenderVillageLayout :many
SELECT type_id, x_coordinate, y_coordinate FROM
village_layout WHERE user_id = $1;

-- name: GetDefenderUID :one
SELECT attacking_on FROM residence_properties
WHERE user_id = $1;

-- name: UpdateAttackerResidence :exec
UPDATE residence_properties SET 
in_battle = FALSE, oil = oil + $1,
attacking_on = $2
WHERE user_id = $2;

-- name: UpdateAttackerStats :exec
UPDATE user_stats SET
total_attacks = total_attacks + 1,
attacks_won = attacks_won + $2,
karma = karma + $3,
oil_looted = oil_looted + $4
WHERE user_id = $1;

-- name: UpdateDefenderResidence :exec
UPDATE residence_properties SET
under_attack = FALSE,
last_attacked = CURRENT_TIMESTAMP,
oil = oil - $2
WHERE user_id = $1;

-- name: UpdateDefenderStats :exec
UPDATE user_stats SET
total_defenses = total_defenses + 1,
defenses_won = defenses_won + $2,
karma = karma + $3
WHERE user_id = $1;
