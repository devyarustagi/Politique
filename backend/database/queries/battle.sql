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
SET in_battle = true 
WHERE user_id = $1;