CREATE TABLE IF NOT EXISTS residence_properties(
    user_id UUID PRIMARY KEY REFERENCES creds( user_id ) ON DELETE CASCADE ,
    residence_level SMALLINT NOT NULL CHECK( residence_level > 0 ) DEFAULT 1 ,
    gems INT NOT NULL CHECK( gems >= 0 ) DEFAULT 50 ,
    oil INT NOT NULL CHECK( oil >= 0 ) DEFAULT 1000 ,
    oil_last_collected TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    gems_last_collected TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    in_battle  BOOLEAN NOT NULL DEFAULT FALSE,
    under_attack BOOLEAN NOT NULL DEFAULT FALSE,
    last_attacked TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attacking_on UUID NOT NULL
);