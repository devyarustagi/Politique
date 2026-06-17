CREATE TABLE IF NOT EXISTS village_layout(
    user_id UUID NOT NULL REFERENCES creds(user_id) ON DELETE CASCADE ,
    global_id BIGSERIAL PRIMARY KEY ,
    type_id SMALLINT NOT NULL REFERENCES buildings_master_table(building_id) ON DELETE CASCADE,
    x_coordinate SMALLINT NOT NULL ,
    y_coordinate SMALLINT NOT NULL ,
    CONSTRAINT unique_location UNIQUE(user_id, x_coordinate, y_coordinate) 
);