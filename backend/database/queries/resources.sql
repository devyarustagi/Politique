-- name: SpendGems :exec
UPDATE residence_properties
SET gems = gems - $2 WHERE user_id = $1;

-- name: SpendOil :exec
UPDATE residence_properties
SET oil = oil - $2 WHERE user_id = $1;

-- name: GetUserOilAmtTz :one
SELECT oil, oil_last_collected
FROM residence_properties 
WHERE user_id = $1;

-- name: UpdataUserOilAmtTz :exec
UPDATE residence_properties
SET oil = oil + $1,
oil_last_collected = $2
WHERE user_id = $3;

-- name: GetUserGemsTz :one
SELECT gems_last_collected
FROM residence_properties
WHERE user_id = $1;

-- name: UpdateUserGemsAmtTz :exec
UPDATE residence_properties
SET gems = gems + $1,
gems_last_collected = $2
WHERE user_id = $3;