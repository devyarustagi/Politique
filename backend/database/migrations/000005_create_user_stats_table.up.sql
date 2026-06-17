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
