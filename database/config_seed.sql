
BEGIN;
-- ── 1. TIERS ──────────────────────────────────────────────────
INSERT INTO tiers (tier, min_karma, max_karma) VALUES
    ('idealist',    0,   100),
    ('opportunist', 101,  200),
    ('despot',      201, 300),
    ('tyrant',      301, 9999)
ON CONFLICT (tier) DO UPDATE SET
    tier = EXCLUDED.tier,
    min_karma = EXCLUDED.min_karma,
    max_karma = EXCLUDED.max_karma;



-- ── 2. MERCENARIES ────────────────────────────────────────────

INSERT INTO mercenaries
    (mercenary_id, mercenary_name, mercenary_level, hp, dps, housing_space,
     movement_speed, mercenary_desc, unlock_level, mercenary_range)
VALUES
(1, 'Goon', 1,  45,  9, 1, 16, 'A reckless brawler who attacks whatever is closest. Weak alone, terrifying in hordes.', 1, 1),
(2, 'Goon', 2,  54,  13, 1, 16, 'A reckless brawler who attacks whatever is closest. Weak alone, terrifying in hordes.', 2, 1),
(3, 'Goon', 3,  65,  16, 1, 16, 'A reckless brawler who attacks whatever is closest. Weak alone, terrifying in hordes.', 3, 1),
(4, 'Goon', 4,  85,  19, 1, 16, 'A reckless brawler who attacks whatever is closest. Weak alone, terrifying in hordes.', 4, 1),
(5, 'Archer', 1,  20,  9,  1, 24, 'Sharp-eyed ranged fighter. Stays back and pokes things until they stop moving.', 1, 4),
(6, 'Archer', 2,  25,  11, 1, 24, 'Sharp-eyed ranged fighter. Stays back and pokes things until they stop moving.', 2, 4),
(7, 'Archer', 3,  30,  14, 1, 24, 'Sharp-eyed ranged fighter. Stays back and pokes things until they stop moving.', 3, 4),
(8, 'Archer', 4,  36,  17, 1, 24, 'Sharp-eyed ranged fighter. Stays back and pokes things until they stop moving.', 4, 4),
(9, 'Terrorist', 1,  40,  100, 2, 24, 'Runs straight at buildings and explodes. Surprisingly dedicated to the cause.', 2, 1),
(10, 'Terrorist', 2,  52,  125, 2, 24, 'Runs straight at buildings and explodes. Surprisingly dedicated to the cause.', 3, 1),
(11, 'Terrorist', 3,  60,  145, 2, 24, 'Runs straight at buildings and explodes. Surprisingly dedicated to the cause.', 4, 1),
(12, 'Bouncer', 1, 500, 17, 5, 12, 'Slow, lumbering bruiser with a lot of muscle.', 3, 1),
(13, 'Bouncer', 2, 600, 23, 5, 12, 'Slow, lumbering bruiser with a lot of muscle.', 4, 1),
(14, 'Tantrik', 1,  90,  70, 4, 16, 'The best black magician of his time.', 3, 3),
(15, 'Tantrik', 2,  108,  90, 4, 16, 'The best black magician of his time.', 4, 3)

ON CONFLICT ON CONSTRAINT unique_mercenary DO UPDATE SET
    hp = EXCLUDED.hp,
    dps = EXCLUDED.dps,
    housing_space = EXCLUDED.housing_space,
    movement_speed = EXCLUDED.movement_speed,
    mercenary_desc = EXCLUDED.mercenary_desc,
    unlock_level = EXCLUDED.unlock_level,
    mercenary_range = EXCLUDED.mercenary_range;


-- ── 3. BUILDINGS MASTER TABLE ─────────────────────────────────


INSERT INTO buildings_master_table
    (building_id, building_type, building_name, building_level, hp, tile_count,
     upgrade_cost, building_desc, unlock_level)
VALUES

-- ── RESIDENCE ─────────────────────────────────────────────────
(1, 'storage', 'Residence', 1,  400, 4, 0,      'The heart of your village. Upgrade to unlock new buildings and troops.', 0),
(2, 'storage', 'Residence', 2,  800, 4, 1000,   'The heart of your village. Upgrade to unlock new buildings and troops.', 1),
(3, 'storage', 'Residence', 3,  1600, 4, 4000,  'The heart of your village. Upgrade to unlock new buildings and troops.', 2),
(4, 'storage', 'Residence', 4,  2000, 4, 25000,  'The heart of your village. Upgrade to unlock new buildings and troops.', 3),

-- ── MERCENARY CAMP ────────────────────────────────────────────
(5, 'storage', 'Mercenary Camp', 1,  100, 4, 200,      'Houses your mercenaries. Higher levels increase total army housing space.', 1),
(6, 'storage', 'Mercenary Camp', 2,  150, 4, 2000,   'Houses your mercenaries. Higher levels increase total army housing space.', 2),
(7, 'storage', 'Mercenary Camp', 3,  200, 4, 10000,   'Houses your mercenaries. Higher levels increase total army housing space.', 3),
(8, 'storage', 'Mercenary Camp', 4,  250, 4, 100000,  'Houses your mercenaries. Higher levels increase total army housing space.', 4),

-- ── OIL STORAGE ───────────────────────────────────────────────
(9, 'storage', 'Oil Storage', 1,  150,  3, 300,      'Stores oil collected from your Oil Collectors. A prime target for Thieves.', 1),
(10, 'storage', 'Oil Storage', 2,  450,  3, 750,   'Stores oil collected from your Oil Collectors. A prime target for Thieves.', 2),
(11, 'storage', 'Oil Storage', 3,  1000,  3, 6000,   'Stores oil collected from your Oil Collectors. A prime target for Thieves.', 3),
(12, 'storage', 'Oil Storage', 4,  1500, 3, 25000,  'Stores oil collected from your Oil Collectors. A prime target for Thieves.', 4),

-- ── CANNON ────────────────────────────────────────────────────
(13, 'defense', 'Cannon', 1,  360, 3, 250,      'Single-target ground defense. Fires at whatever gets closest.', 1),
(14, 'defense', 'Cannon', 2,  420, 3, 4000,   'Single-target ground defense. Fires at whatever gets closest.', 2),
(15, 'defense', 'Cannon', 3,  500, 3, 16000,   'Single-target ground defense. Fires at whatever gets closest.', 3),
(16, 'defense', 'Cannon', 4,  600, 3, 50000,  'Single-target ground defense. Fires at whatever gets closest.', 4),

-- ── ARCHER TOWER ──────────────────────────────────────────────
(17, 'defense', 'Archer Tower', 1,  420, 3, 1000,   'Ranged defense that targets both ground and air troops.', 2),
(18, 'defense', 'Archer Tower', 2,  460, 3, 5000,   'Ranged defense that targets both ground and air troops.', 3),
(19, 'defense', 'Archer Tower', 3,  500, 3, 20000,  'Ranged defense that targets both ground and air troops.', 4),

-- ── MORTAR ────────────────────────────────────────────────────
(20, 'defense', 'Mortar', 1,  400, 3, 5000,      'Lobs shells in an arc dealing splash damage. Cannot target nearby troops.', 3),
(21, 'defense', 'Mortar', 2,  450, 3, 25000,   'Lobs shells in an arc dealing splash damage. Cannot target nearby troops.', 4),

-- ── OIL COLLECTOR ─────────────────────────────────────────────
(22, 'collector', 'Oil Collector', 1,  150, 3, 150,      'Pumps oil over time and stores it until collected.', 1),
(23, 'collector', 'Oil Collector', 2,  400, 3, 700,   'Pumps oil over time and stores it until collected.', 2),
(24, 'collector', 'Oil Collector', 3,  550, 3, 3000,   'Pumps oil over time and stores it until collected.', 3),
(25, 'collector', 'Oil Collector', 4,  660, 3, 14000,  'Pumps oil over time and stores it until collected.', 4),

-- ── GEM COLLECTOR (builder base style, no gem storage) ────────
(26, 'collector', 'Gem Collector', 1,  150, 3, 250,      'Slowly produces gems over time. No storage building required.', 1),
(27, 'collector', 'Gem Collector', 2,  400, 3, 1400,    'Slowly produces gems over time. No storage building required.', 2),
(28, 'collector', 'Gem Collector', 3,  550, 3, 5000,   'Slowly produces gems over time. No storage building required.', 3),
(29, 'collector', 'Gem Collector', 4,  660, 3, 18000,  'Slowly produces gems over time. No storage building required.', 4)

ON CONFLICT ON CONSTRAINT unique_building DO UPDATE SET
    hp = EXCLUDED.hp,
    tile_count = EXCLUDED.tile_count,
    upgrade_cost = EXCLUDED.upgrade_cost,
    building_desc = EXCLUDED.building_desc,
    unlock_level = EXCLUDED.unlock_level;


-- ── 4. DEFENSES sub-table ─────────────────────────────────────

INSERT INTO defenses (building_id, defense_range, dps, attack_rate)
VALUES
    (13, 9,  10, 800),
    (14, 9,  13, 800),
    (15, 9,  17, 800),
    (16, 9,  23, 800),
    (17, 10,  15, 500),
    (18, 10,  19, 500),
    (19, 10,  25, 500),
    (20, 11,   4, 5000),
    (21, 11,  5, 5000)
ON CONFLICT (building_id) DO UPDATE SET
    defense_range = EXCLUDED.defense_range,
    dps = EXCLUDED.dps,
    attack_rate = EXCLUDED.attack_rate;


-- ── 5. STORAGES sub-table ─────────────────────────────────────

INSERT INTO storages (building_id, storage_capacity)
VALUES
    (1,  1000),
    (2,  2500),
    (3,  10000),
    (4,  50000),
    (5,  20),
    (6,  30),
    (7,  35),
    (8,  40),
    (9,  1500),
    (10,  6000),
    (11,  45000),
    (12,  225000)
ON CONFLICT (building_id) DO UPDATE SET
    storage_capacity = EXCLUDED.storage_capacity;

-- ── 6. COLLECTORS sub-table ───────────────────────────────────
INSERT INTO collectors (building_id, production_rate, storage_capacity)
VALUES
    (23,  800,  5000),
    (22,  400,   2000),
    (24,  1300,  20000),
    (25,  1900,  50000),
    (26,  1,    16),
    (27,  2,    32),
    (28,  3,    48),
    (29,  4,    64)
ON CONFLICT (building_id) DO UPDATE SET
    production_rate = EXCLUDED.production_rate,
    storage_capacity = EXCLUDED.storage_capacity;

COMMIT;
