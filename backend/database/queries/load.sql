-- name: GetResidenceInfo :one
SELECT creds.username, residence_level, gems, oil, oil_last_collected, gems_last_collected
FROM creds JOIN residence_properties
ON creds.user_id = residence_properties.user_id
WHERE creds.user_id = $1;

-- name: GetUserStats :one
SELECT total_attacks, attacks_won, total_defenses, defenses_won, karma, oil_looted
FROM user_stats
WHERE user_stats.user_id = $1;

-- name: GetUserVillageLayout :many
SELECT global_id, type_id, x_coordinate, y_coordinate
FROM village_layout
WHERE village_layout.user_id = $1
ORDER BY village_layout.global_id ASC;
