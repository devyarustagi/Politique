-- name: RegisterNewUser :one
INSERT INTO creds (username, pass_hash)
VALUES ( $1, $2 )
RETURNING user_id;

-- name: GetUserByName :one
SELECT pass_hash, user_id FROM creds WHERE username = $1 ;