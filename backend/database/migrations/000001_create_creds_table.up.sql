CREATE TABLE IF NOT EXISTS creds(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid() ,
    username VARCHAR(48) UNIQUE NOT NULL ,
    pass_hash VARCHAR(255) NOT NULL ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP ,
    refresh_token_hash BYTEA UNIQUE ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_token_expiry TIMESTAMPTZ 
);
