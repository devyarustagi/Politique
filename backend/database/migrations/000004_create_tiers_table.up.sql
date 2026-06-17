CREATE TABLE IF NOT EXISTS tiers(
    tier VARCHAR(32) PRIMARY KEY NOT NULL ,
    min_karma INT NOT NULL CHECK( min_karma >= 0 ) ,
    max_karma INT NOT NULL CHECK( max_karma > min_karma )
);