import Phaser from "phaser";
import grassUrl from '$lib/assets/grass.png';
import mapUrl from '$lib/assets/map.json?url';
import { userArmy, gameinfo, resources } from "$lib/gameState.svelte";
import { api } from "$lib/api/apiRoutes";

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init(data) {
        this.defenderName = data.name;
        this.defenderKarma = data.karma;
        this.lootAvailable = data.loot_available;
        this.defenderLayout = data.village_layout; 
        this.defenderLayout.forEach((building) => {
            const idx = building.type_id;
            const b = gameinfo.info.buildings_master_table[idx-1];
            building.hp = b.hp;
            building.tile_count = b.tile_count;
            building.name = b.building_name;
            building.level = b.building_level;
            if(b.building_type === "defense"){
                for(const defense of gameinfo.info.defenses){
                    console.log(defense);
                    if(defense.building_id !== idx) continue;
                    building.range = defense.defense_range;
                    building.dps = defense.dps;
                    building.attack_rate = defense.attack_rate;
                    break;
                }
            }
        })
        this.playerArmy = [];
        userArmy.forEach(troop => {
                if( troop.count > 0 && troop.unlock_level === resources.residenceLevel ){
                    this.playerArmy.push({...troop});
                }
        })
        
        // Battle State Tracking
        this.selectedTroopIndex = null;
        this.deployedTroopsCount = 0;
        
        this.activeBuildings = [];
        this.activeTroops = [];
        this.totalBuildings = this.defenderLayout.length;
        this.battleEnded = false;
    }

    preload() {
        this.load.image('grass_img', grassUrl);
        this.load.tilemapTiledJSON('my_map', mapUrl);
        this.load.setPath('assets/');
        this.load.atlasPCT('buildings', 'atlas.pct');
        this.load.atlasPCT('mercenaries', 'mercenaries.pct');
        this.load.setPath();
    }

    create() {
        this.map = this.make.tilemap({ key: 'my_map' });
        const tileset = this.map.addTilesetImage('grass', 'grass_img');
        this.map.createLayer('Tile Layer 1', tileset, 0, 0);
        this.tileSize = 32;
        
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.enemyBuildingsGroup = this.add.group({ classType: Phaser.GameObjects.Image });
        this.deployedTroopsGroup = this.add.group({ classType: Phaser.GameObjects.Image });

        this.defenderLayout.forEach((buildingData) => {
            this.renderEnemyBuilding(buildingData);
        });

        this.setupCameraControls();
        this.setupDeploymentInput();

        this.scene.launch('BattleUIScene', { battleScene: this });
        window.addEventListener('visibilitychange', this.handleVisibilityChange);
        this.events.once('shutdown', this.cleanupListener, this);
        this.events.once('destroy', this.cleanupListener, this);
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            const destroyedCount = this.totalBuildings - this.activeBuildings.length;
            const percent = Math.floor((destroyedCount / this.totalBuildings) * 100);
            let karma = 0;
            if (percent === 100) karma = 3;
            else if (percent >= 75) karma = 2;
            else if (percent >= 50) karma = 1;
            const oil =  Math.floor(this.lootAvailable * percent / 100); 
            const result = { 
                karma_gained: karma,
                oil_looted: oil
            };
            fetch(api.battle(), {
                method: "PATCH",
                credentials: "include",
                headers: {
                "Content-Type": "application/json"
                },
                body: JSON.stringify(result),
                keepalive: true
            });
        }
    }
    cleanupListener() {
        window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    createHealthBar(x, y, width, height, currentHp, maxHp) {
        const percent = Math.max(0, currentHp / maxHp);
        const bg = this.add.rectangle(x, y, width, height, 0x000000, 0.8).setOrigin(0, 0.5);
        const fill = this.add.rectangle(x, y, width * percent, height, 0xff0000, 1).setOrigin(0, 0.5);
        return { bg, fill, maxWidth: width, maxHp: maxHp };
    }

    updateHealthBar(hpBar, currentHp, maxHp) {
        const percent = Math.max(0, currentHp / maxHp);
        hpBar.fill.width = hpBar.maxWidth * percent;
    }

    setupCameraControls() {
        let isSwiping = false;

        this.input.on('pointerdown', () => { isSwiping = true; });
        this.input.on('pointerup', () => { isSwiping = false; });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown || !isSwiping) return;
            this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
            this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        });

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const cam = this.cameras.main;
            const newZoom = cam.zoom - (deltaY * 0.01);
            cam.setZoom(Phaser.Math.Clamp(newZoom, 1, 4));
        });
    }

    renderEnemyBuilding(buildingData) {
        const pixelX = buildingData.x_coordinate * this.tileSize;
        const pixelY = buildingData.y_coordinate * this.tileSize;
        const textureName = `${buildingData.name}${buildingData.level}`;
        const buildingImg = this.add.image(pixelX, pixelY, 'buildings', textureName);
        
        buildingImg.setOrigin(0);
        const sz = buildingData.tile_count;
        buildingImg.setDisplaySize(this.tileSize * sz, this.tileSize * sz);
        this.enemyBuildingsGroup.add(buildingImg);

        const currentHp = buildingData.hp; 
        const maxHp = buildingData.hp;
        
        const barWidth = (this.tileSize * sz) * 0.6; 
        const barX = pixelX + ((this.tileSize * sz) - barWidth) / 2;
        const barY = pixelY;

        buildingImg.hpBar = this.createHealthBar(barX, barY, barWidth, 6, currentHp, maxHp);

        // Store live building data for battle logic
        this.activeBuildings.push({
            ...buildingData,
            sprite: buildingImg,
            currentHp: currentHp,
            maxHp: maxHp,
            lastAttackTime: 0,
            centerX: pixelX + (sz * this.tileSize) / 2, // Helps with accurate range calculation
            centerY: pixelY + (sz * this.tileSize) / 2
        });
    }

    setupDeploymentInput() {
        this.input.on('pointerup', (pointer) => {
            const dragDistance = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
            if (dragDistance > 6) return; 

            if (this.selectedTroopIndex === null) return;
            const troopData = this.playerArmy[this.selectedTroopIndex];
            if (troopData.count <= 0) return;

            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.deployTroop(worldPoint.x, worldPoint.y, troopData);
        });
    }

    deployTroop(worldX, worldY, troopData) {
        this.playerArmy[this.selectedTroopIndex].count -= 1;
        this.deployedTroopsCount++;

        const uiScene = this.scene.get('BattleUIScene');
        uiScene.updateTroopCardUI(this.selectedTroopIndex);

        const textureName = `${troopData.mercenary_name}${troopData.mercenary_level}`;
        const troopSprite = this.add.image(worldX, worldY, 'mercenaries', textureName);
        if(troopData.mercenary_name === "Bouncer"){
            troopSprite.setDisplaySize(70, 70);
        }
        else {
            troopSprite.setDisplaySize(36,36);
        }
         
        this.deployedTroopsGroup.add(troopSprite);

        // Track live troop data
        this.activeTroops.push({
            ...troopData,
            sprite: troopSprite,
            currentHp: troopData.hp,
            target: null,
            lastAttackTime: 0
        });

        if (troopData.count <= 0) {
            uiScene.clearSelection();
        }
    }

    // --- GAME LOOP: BATTLE LOGIC ---
    update(time, delta) {
        if (this.battleEnded) return;

        // 1. Troop Logic (Move & Attack)
        for (let i = this.activeTroops.length - 1; i >= 0; i--) {
            const troop = this.activeTroops[i];

            // Assign new target if none or current is destroyed
            if (!troop.target || troop.target.currentHp <= 0) {
                troop.target = this.getNearestBuilding(troop.sprite.x, troop.sprite.y);
            }

            if (troop.target) {
                const dist = Phaser.Math.Distance.Between(troop.sprite.x, troop.sprite.y, troop.target.centerX, troop.target.centerY);
                
                // Attack range calculation (troop range + half building width so they don't clip inside)
                const attackRadius = (troop.mercenary_range * this.tileSize) + (troop.target.tile_count * this.tileSize / 2);

                if (dist > attackRadius) {
                    // Move towards target
                    const angle = Math.atan2(troop.target.centerY - troop.sprite.y, troop.target.centerX - troop.sprite.x);
                    const speed = troop.movement_speed * 1.5; // Base modifier to make movement visible
                    
                    troop.sprite.x += Math.cos(angle) * speed * (delta / 1000);
                    troop.sprite.y += Math.sin(angle) * speed * (delta / 1000);
                } else {
                    // Attack Building (1 attack per second)
                    if (time > troop.lastAttackTime + 1000) {
                        troop.target.currentHp -= troop.dps;
                        troop.lastAttackTime = time;
                        this.updateHealthBar(troop.target.sprite.hpBar, troop.target.currentHp, troop.target.maxHp);
                    }
                }
            }
        }

        // 2. Defense Building Logic
        for (let i = this.activeBuildings.length - 1; i >= 0; i--) {
            const b = this.activeBuildings[i];

            // Check if building was destroyed
            if (b.currentHp <= 0) {
                b.sprite.hpBar.bg.destroy();
                b.sprite.hpBar.fill.destroy();
                b.sprite.destroy();
                this.activeBuildings.splice(i, 1);
                continue;
            }

            // If it is a defense building, shoot at troops
            if (b.range !== undefined) {
                const nearestTroop = this.getNearestTroop(b.centerX, b.centerY, b.range * this.tileSize);
                
                if (nearestTroop !== null) {
                    const cooldown = b.attack_rate;
                    if (time > b.lastAttackTime + cooldown) {
                        nearestTroop.currentHp -= b.dps;
                        b.lastAttackTime = time;

                        if (nearestTroop.currentHp <= 0) {
                            nearestTroop.sprite.destroy();
                            this.activeTroops = this.activeTroops.filter(t => t !== nearestTroop);
                        }
                    }
                }
            }
        }

        // 3. Check Game End Conditions
        if (this.activeBuildings.length === 0) {
            this.concludeBattle(); // Total Victory
        } else if (this.activeTroops.length === 0 && this.deployedTroopsCount > 0) {
            // All deployed troops are dead. Check if player has any reserves left to place.
            const hasReserves = this.playerArmy.some(t => t.count > 0);
            if (!hasReserves) {
                this.concludeBattle(); // Army wiped out
            }
        }
    }

    getNearestBuilding(x, y) {
        let nearest = null;
        let minDist = Infinity;
        for (const b of this.activeBuildings) {
            const dist = Phaser.Math.Distance.Between(x, y, b.centerX, b.centerY);
            if (dist < minDist) {
                minDist = dist;
                nearest = b;
            }
        }
        return nearest;
    }

    getNearestTroop(x, y, maxRange) {
        let nearest = null;
        let minDist = maxRange;
        for (const t of this.activeTroops) {
            const dist = Phaser.Math.Distance.Between(x, y, t.sprite.x, t.sprite.y);
            if (dist <= minDist) {
                minDist = dist;
                nearest = t;
            }
        }
        return nearest;
    }

    concludeBattle() {
        if (this.battleEnded) return;
        this.battleEnded = true;

        const uiScene = this.scene.get('BattleUIScene');
        if (uiScene) uiScene.time.removeAllEvents();

        const destroyedCount = this.totalBuildings - this.activeBuildings.length;
        const percent = Math.floor((destroyedCount / this.totalBuildings) * 100);

        let karma = 0;
        if (percent === 100) karma = 3;
        else if (percent >= 75) karma = 2;
        else if (percent >= 50) karma = 1;
        const oil =  Math.floor(this.lootAvailable * percent / 100); 
        this.scene.stop('BattleUIScene');
        this.scene.start('BattleResultScene', {
            percent: percent,
            karma: karma,
            oil: oil
        });
    }
}