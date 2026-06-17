CREATE TABLE IF NOT EXISTS mercenaries(
    mercenary_id SMALLINT PRIMARY KEY ,
    mercenary_name VARCHAR(32) NOT NULL ,
    mercenary_level SMALLINT NOT NULL CHECK( mercenary_level > 0 ) ,
    hp SMALLINT NOT NULL CHECK( hp > 0 ) , 
    dps SMALLINT NOT NULL CHECK( dps > 0 ) ,
    housing_space SMALLINT NOT NULL CHECK( housing_space > 0 ) ,
    movement_speed SMALLINT NOT NULL CHECK( movement_speed >= 0 ) ,
    mercenary_desc VARCHAR(512) NOT NULL ,
    unlock_level SMALLINT NOT NULL CHECK( unlock_level > 0 ) ,
    mercenary_range SMALLINT NOT NULL CHECK( mercenary_range >= 1 ) ,
    CONSTRAINT unique_mercenary UNIQUE( mercenary_name, mercenary_level )
);