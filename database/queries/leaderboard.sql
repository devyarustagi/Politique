-- name: FetchUserTier :one
SELECT tier FROM tiers
WHERE $1 BETWEEN min_karma AND max_karma

