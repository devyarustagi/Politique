-- name: RegisterNewUser :one
WITH new_user AS (
    INSERT INTO creds (username, pass_hash)
    VALUES ($1, $2)
    RETURNING user_id
),
new_stats AS (
    INSERT INTO user_stats (user_id)
    SELECT user_id FROM new_user
),
new_residence AS (
    INSERT INTO residence_properties (user_id, residence_level, gems, oil)
    SELECT user_id, 1, 50, 1000 FROM new_user
)
INSERT INTO village_layout (user_id, type_id, x_coordinate, y_coordinate)
SELECT user_id, v.type_id, v.x, v.y
FROM new_user
CROSS JOIN (
    VALUES
        (1::SMALLINT,  15::SMALLINT, 15::SMALLINT), 
        (5::SMALLINT,  15::SMALLINT, 25::SMALLINT), 
        (9::SMALLINT,  25::SMALLINT, 15::SMALLINT), 
        (13::SMALLINT, 20::SMALLINT, 25::SMALLINT),
        (22::SMALLINT, 10::SMALLINT, 10::SMALLINT),
        (26::SMALLINT, 5::SMALLINT, 5::SMALLINT),
) AS v(type_id, x, y)
RETURNING user_id;

-- name: GetUserByName :one
SELECT pass_hash, user_id FROM creds WHERE username = $1 ;

-- name: UpdateRefreshToken :exec
UPDATE creds 
SET 
refresh_token_hash = $2,
refresh_token_expiry = $3
WHERE user_id = $1;

-- name: GetUserbyRTHash :one
SELECT user_id, refresh_token_expiry FROM creds WHERE refresh_token_hash = $1;

-- name: GetUserResidenceLevel :one
SELECT residence_level FROM residence_properties WHERE user_id = $1;