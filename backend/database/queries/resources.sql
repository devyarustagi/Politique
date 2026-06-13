-- name: SpendGems :exec
UPDATE residence_properties
SET gems = gems - $2 WHERE user_id = $1;

-- name: SpendOil :exec
UPDATE residence_properties
SET oil = oil - $2 WHERE user_id = $1;