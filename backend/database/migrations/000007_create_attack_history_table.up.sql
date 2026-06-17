CREATE TABLE IF NOT EXISTS attack_history(
    attack_id BIGSERIAL PRIMARY KEY ,
    attacker_id UUID REFERENCES creds(user_id) ,
    defender_id UUID REFERENCES creds(user_id) ,
    attack_timestamp TIMESTAMPTZ NOT NULL ,
    attack_events JSONB NOT NULL ,
    karma_gained SMALLINT NOT NULL CHECK( karma_gained BETWEEN 0 AND 3 ) ,
    destruction_percentage SMALLINT NOT NULL CHECK( destruction_percentage BETWEEN 0 and 100 ) ,
    CONSTRAINT valid_attack_timestamp
    CHECK ( attack_timestamp >= '2026-01-01 00:00:00+05:30' )
);

CREATE INDEX attackers_idx ON attack_history(attacker_id) ;
CREATE INDEX defenders_idx ON attack_history(defender_id) ;