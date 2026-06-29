-- name: UserTier :one
SELECT tier FROM tiers
WHERE $1 BETWEEN min_karma AND max_karma;

-- name: Leaderboard :many
SELECT 
DENSE_RANK() OVER(ORDER BY karma DESC) AS rank,
creds.user_id, username, attacks_won, total_attacks, defenses_won, total_defenses, karma
FROM creds JOIN user_stats ON creds.user_id = user_stats.user_id
LIMIT 100;

-- name: UserPercentile :one
SELECT percentile
FROM (
    SELECT
        user_id,
        ROUND((PERCENT_RANK() OVER (ORDER BY karma ASC) * 100)::NUMERIC, 2) AS percentile
    FROM user_stats
)
WHERE user_id = $1;
