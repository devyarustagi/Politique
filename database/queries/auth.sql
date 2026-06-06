-- name: RegisterNewUser :exec
INSERT INTO creds (username, pass_hash)
VALUES ( $1, $2 );