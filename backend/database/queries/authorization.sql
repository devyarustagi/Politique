-- name: IsBaseUnderAttack :one
SELECT under_attack FROM residence_properties WHERE user_id = $1;