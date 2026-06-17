CREATE TYPE BUILDING_TYPES AS ENUM( 'defense', 'storage', 'collector' );

CREATE TABLE IF NOT EXISTS buildings_master_table(
    building_id SMALLINT PRIMARY KEY ,
    building_type BUILDING_TYPES NOT NULL ,
    building_name VARCHAR(32) NOT NULL ,
    building_level SMALLINT NOT NULL CHECK( building_level >= 1 ) ,
    hp SMALLINT NOT NULL CHECK( hp > 0 ) ,
    tile_count SMALLINT NOT NULL CHECK( tile_count > 0 ) ,
    upgrade_cost INT NOT NULL CHECK( upgrade_cost >= 0 ) ,
    building_desc VARCHAR(256) NOT NULL,
    unlock_level SMALLINT NOT NULL CHECK( unlock_level >= 0 ) ,
    CONSTRAINT unique_building UNIQUE( building_name , building_level )
);