CREATE TABLE IF NOT EXISTS defenses(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    defense_range SMALLINT NOT NULL CHECK( defense_range >= 1 ) ,
    dps SMALLINT NOT NULL CHECK( dps > 0 ) ,
    attack_rate SMALLINT NOT NULL CHECK( attack_rate > 0 ) 
);