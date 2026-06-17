CREATE TABLE IF NOT EXISTS user_army(
    user_id UUID REFERENCES creds(user_id) ON DELETE CASCADE ,
    mercenary_id SMALLINT NOT NULL CHECK( mercenary_id > 0 ) REFERENCES mercenaries(mercenary_id) ON DELETE CASCADE ,
    count SMALLINT NOT NULL CHECK( count > 0 ) , --carefully notice that troop count zero is disallowed
    CONSTRAINT army_pk PRIMARY KEY ( user_id, mercenary_id ) 
);