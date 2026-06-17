CREATE TABLE IF NOT EXISTS collectors(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    production_rate INT NOT NULL CHECK( production_rate > 0 ) ,
    storage_capacity INT NOT NULL CHECK( storage_capacity > 0 )
);