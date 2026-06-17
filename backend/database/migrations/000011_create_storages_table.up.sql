CREATE TABLE IF NOT EXISTS storages(
    building_id SMALLINT PRIMARY KEY REFERENCES buildings_master_table(building_id) ON DELETE CASCADE ,
    storage_capacity INT NOT NULL CHECK( storage_capacity > 0 )
);