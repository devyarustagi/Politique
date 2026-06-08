CREATE TYPE BUILDING_TYPES AS ENUM( 'defense', 'storage', 'collector' );

CREATE TABLE IF NOT EXISTS creds(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid() ,
    username VARCHAR(48) UNIQUE NOT NULL ,
    pass_hash VARCHAR(255) NOT NULL ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP ,
    refresh_token_hash BYTEA UNIQUE ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_stats(
    user_id UUID PRIMARY KEY REFERENCES creds(user_id) ON DELETE CASCADE ,
    total_attacks INT NOT NULL CHECK( total_attacks >= attacks_won ) DEFAULT 0 ,
    attacks_won INT NOT NULL CHECK( attacks_won >= 0 ) DEFAULT 0 ,
    total_defenses INT NOT NULL CHECK( total_defenses >= defenses_won ) DEFAULT 0 ,
    defenses_won INT NOT NULL CHECK( defenses_won >= 0 ) DEFAULT 0 ,
    karma INT NOT NULL CHECK( karma >= 0 ) DEFAULT 0 ,
    oil_looted BIGINT NOT NULL CHECK( oil_looted >= 0 ) DEFAULT 0 
);

CREATE INDEX user_karma_idx ON user_stats(karma) ;

CREATE TABLE IF NOT EXISTS mercenaries(
    mercenary_id SMALLINT PRIMARY KEY ,
    mercenary_name VARCHAR(32) NOT NULL ,
    mercenary_level SMALLINT NOT NULL CHECK( mercenary_level > 0 ) ,
    hp SMALLINT NOT NULL CHECK( hp > 0 ) , 
    dps SMALLINT NOT NULL CHECK( dps > 0 ) ,
    housing_space SMALLINT NOT NULL CHECK( housing_space > 0 ) ,
    movement_speed SMALLINT NOT NULL CHECK( movement_speed >= 0 ) ,
    mercenary_desc VARCHAR(512) ,
    unlock_level SMALLINT NOT NULL CHECK( unlock_level > 0 ) ,
    mercenary_range SMALLINT NOT NULL CHECK( mercenary_range >= 1 ) ,
    CONSTRAINT unique_mercenary UNIQUE( mercenary_name, mercenary_level )
);

CREATE TABLE IF NOT EXISTS user_army(
    user_id UUID REFERENCES creds(user_id) ON DELETE CASCADE ,
    mercenary_id SMALLINT NOT NULL CHECK( mercenary_id > 0 ) REFERENCES mercenaries(mercenary_id) ON DELETE CASCADE ,
    count SMALLINT NOT NULL CHECK( count > 0 ) , --carefully notice that troop count zero is disallowed
    CONSTRAINT army_pk PRIMARY KEY ( user_id, mercenary_id ) 
);

CREATE TABLE IF NOT EXISTS residence_properties(
    user_id UUID PRIMARY KEY REFERENCES creds( user_id ) ON DELETE CASCADE ,
    residence_level SMALLINT NOT NULL CHECK( residence_level > 0 ) DEFAULT 1 ,
    gems INT NOT NULL CHECK( gems >= 0 ) DEFAULT 250 ,
    oil INT NOT NULL CHECK( oil >= 0 ) DEFAULT 1000 ,
    oil_last_collected TIMESTAMPTZ ,  --default value will be null because initially user won't have unlocked oil collector
    gems_last_collected TIMESTAMPTZ ,
    CONSTRAINT valid_collection_dates
    CHECK ( oil_last_collected >= '2026-01-01 00:00:00+05:30' AND gems_last_collected >= '2026-01-01 00:00:00+05:30' )
);

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

CREATE TABLE IF NOT EXISTS buildings_master_table(
    building_id SMALLINT PRIMARY KEY ,
    building_type BUILDING_TYPES NOT NULL ,
    building_name VARCHAR(32) NOT NULL ,
    building_level SMALLINT NOT NULL CHECK( building_level >= 1 ) ,
    hp SMALLINT NOT NULL CHECK( hp > 0 ) ,
    tile_count SMALLINT NOT NULL CHECK( tile_count > 0 ) ,
    upgrade_cost INT NOT NULL CHECK( upgrade_cost >= 0 ) ,
    building_desc VARCHAR(256) ,
    unlock_level SMALLINT NOT NULL CHECK( unlock_level >= 0 ) ,
    upgrade_time INT NOT NULL CHECK( upgrade_time >= 0 ) ,
    CONSTRAINT unique_building UNIQUE( building_name , building_level )
);

CREATE TABLE IF NOT EXISTS village_layout(
    user_id UUID NOT NULL REFERENCES creds(user_id) ON DELETE CASCADE ,
    global_id BIGSERIAL PRIMARY KEY ,
    type_id SMALLINT NOT NULL REFERENCES buildings_master_table(building_id) ON DELETE CASCADE,
    x_coordinate SMALLINT NOT NULL ,
    y_coordinate SMALLINT NOT NULL ,
    upgrade_completion_timestamp TIMESTAMPTZ ,
    CONSTRAINT unique_location UNIQUE(user_id, x_coordinate, y_coordinate) ,
    CONSTRAINT valid_x CHECK( x_coordinate BETWEEN 0 AND 40 ) ,
    CONSTRAINT valid_y CHECK( y_coordinate BETWEEN 0 AND 40 ) 
);

CREATE TABLE IF NOT EXISTS tiers(
    tier VARCHAR(32) PRIMARY KEY NOT NULL ,
    min_karma INT NOT NULL CHECK( min_karma >= 0 ) ,
    max_karma INT NOT NULL CHECK( max_karma > min_karma )
);

CREATE TABLE IF NOT EXISTS defenses(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    defense_range SMALLINT NOT NULL CHECK( defense_range >= 1 ) ,
    dps SMALLINT NOT NULL CHECK( dps > 0 ) ,
    attack_rate SMALLINT NOT NULL CHECK( attack_rate > 0 ) 
);

CREATE TABLE IF NOT EXISTS storages(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    storage_capacity INT NOT NULL CHECK( storage_capacity > 0 )
);

CREATE TABLE IF NOT EXISTS collectors(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    production_rate INT NOT NULL CHECK( production_rate > 0 ) ,
    storage_capacity INT NOT NULL CHECK( storage_capacity > 0 )
);
