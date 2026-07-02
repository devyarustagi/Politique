import Phaser from "phaser";
import grassUrl from '$lib/assets/grass.png';
import mapUrl from '$lib/assets/map.json?url';
import { gameinfo, resources } from '$lib/gameState.svelte';
import { moveBuilding } from "$lib/api/moveBuilding";
import { upgradeBuilding } from "$lib/api/upgradeBuilding";

export class ResidenceScene extends Phaser.Scene {
    constructor() {
        super('ResidenceScene');
    }

    preload() {
        this.load.image('grass_img', grassUrl);
        this.load.tilemapTiledJSON('my_map', mapUrl);
        this.load.setPath('assets/');
        this.load.atlasPCT('buildings', 'atlas.pct');
        this.load.atlasPCT('mercenaries', 'mercenaries.pct')
        this.load.setPath();
    }

    create() {
        this.map = this.make.tilemap({ key: 'my_map' });
        const tileset = this.map.addTilesetImage('grass', 'grass_img');
        this.map.createLayer('Tile Layer 1', tileset, 0, 0);
        this.tileSize = 32;
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        this.isDraggingBuilding = false;
        this.selectedBuilding = null;
        this.nextLevelData = null;

        this.buildingGroup = this.add.group({
            classType: Phaser.GameObjects.Image,
        });

        const hitbox = this.add.rectangle(0, 0, 32, 32, 0x00FF00, 0.5);
        hitbox.setOrigin(0, 0);
        hitbox.setVisible(false);

        // --- Drag Events ---
        this.input.on('dragstart', (pointer, gameObject) => {
            this.isDraggingBuilding = true;
            this.actionMenu.setVisible(false); // Hide menu on drag
            this.selectedBuilding = null;

            gameObject.setData('startX', gameObject.x);
            gameObject.setData('startY', gameObject.y);
            hitbox.x = gameObject.x;
            hitbox.y = gameObject.y;
            hitbox.setDisplaySize(gameObject.displayWidth, gameObject.displayHeight);
            hitbox.setVisible(true);
        });

        this.input.on('dragend', (pointer, gameObject) => {
            this.isDraggingBuilding = false;
            hitbox.setVisible(false);
            if (gameObject.getData('isValid') === false) {
                gameObject.x = gameObject.getData('startX');
                gameObject.y = gameObject.getData('startY');
            }
            const promise = moveBuilding(gameObject.getData("global_id"), Math.floor(gameObject.x / this.tileSize), Math.floor(gameObject.y / this.tileSize));
            promise.then(ok => {
                if (!ok) {
                    gameObject.x = gameObject.getData('startX');
                    gameObject.y = gameObject.getData('startY');
                }
            })
            hitbox.fillColor = 0x00FF00;
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            const snappedX = Math.floor(dragX / this.tileSize) * this.tileSize;
            const snappedY = Math.floor(dragY / this.tileSize) * this.tileSize;
            gameObject.x = snappedX;
            gameObject.y = snappedY;
            hitbox.x = snappedX;
            hitbox.y = snappedY;
            
            let isOverlapping = false;
            const objBounds = gameObject.getBounds();
            const allBuildings = this.buildingGroup.getChildren();
            Phaser.Geom.Rectangle.Inflate(objBounds, -1, -1);
            
            if (hitbox.x < 0 || hitbox.x + hitbox.displayWidth > this.map.widthInPixels) {
                isOverlapping = true;
            } else if (hitbox.y < 0 || hitbox.y + hitbox.displayHeight > this.map.heightInPixels) {
                isOverlapping = true;
            } else {
                for (const otherBuilding of allBuildings) {
                    if (otherBuilding === gameObject) continue;
                    if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, otherBuilding.getBounds())) {
                        isOverlapping = true;
                        break;
                    }
                }
            }
            if (isOverlapping) {
                hitbox.fillColor = 0xFF0000;
                gameObject.setData('isValid', false);
            } else {
                hitbox.fillColor = 0x00FF00;
                gameObject.setData('isValid', true);
            }
        });

        // --- Camera & Map Input ---
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown || this.isDraggingBuilding) return;
            this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
            this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        });

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const cam = this.cameras.main;
            const newZoom = cam.zoom - (deltaY * 0.01);
            cam.setZoom(Phaser.Math.Clamp(newZoom, 1, 4));
        });

        // Deselect building if clicking on empty grass
        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (gameObjects.length === 0) {
                this.actionMenu.setVisible(false);
                this.selectedBuilding = null;
            }
        });
        gameinfo.info.village_layout.forEach((buildingData) => {
            this.addNewBuilding(buildingData);
        });

        // --- Create UI Elements ---
        this.createActionMenu();
        this.createInfoPopup();
        this.createUpgradePopup();
    }

    enrichBuildingData(typeID){
        const b = gameinfo.info.buildings_master_table[typeID - 1];
            if (b.building_type === 'storage'){
                for(const storage of gameinfo.info.storages)
                {
                    if(storage.building_id === typeID){
                        return {...b,  ...storage};
                    }
                }
            }
            else if (b.building_type === 'defense'){
                for(const defense of gameinfo.info.defenses)
                {
                    if(defense.building_id === typeID){
                        return {...b,  ...defense};
                    }
                        
                }
            }
            else {
                for(const collector of gameinfo.info.collectors)
                {
                    if(collector.building_id === typeID){
                        return {...b,  ...collector};
                    }
                }
            }
    }       

    findEmptySpot(id) {
        const tileCount = gameinfo.info.buildings_master_table[id - 1].tile_count;
        const maxGridX = Math.floor(this.map.widthInPixels / this.tileSize) - tileCount;
        const maxGridY = Math.floor(this.map.heightInPixels / this.tileSize) - tileCount;

        for (let y = 0; y <= maxGridY; y++) {
            for (let x = 0; x <= maxGridX; x++) {
                const testRect = new Phaser.Geom.Rectangle(
                    x * this.tileSize, y * this.tileSize,
                    tileCount * this.tileSize, tileCount * this.tileSize
                );
                Phaser.Geom.Rectangle.Inflate(testRect, -1, -1);

                let isOverlapping = false;
                const allBuildings = this.buildingGroup.getChildren();
                for (const building of allBuildings) {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(testRect, building.getBounds())) {
                        isOverlapping = true;
                        break;
                    }
                }
                if (!isOverlapping) return { x_coordinate: x, y_coordinate: y };
            }
        }
        return null;
    }

    addNewBuilding(buildingData) {
        const baseStats = this.enrichBuildingData(buildingData.type_id)
        const pixelX = buildingData.x_coordinate * this.tileSize;
        const pixelY = buildingData.y_coordinate * this.tileSize;
        const building_img = this.add.image(pixelX, pixelY, 'buildings', `${baseStats.building_name}${baseStats.building_level}`);
        building_img.setOrigin(0);
        
        const sz = baseStats.tile_count;
        building_img.setSize(this.tileSize * sz, this.tileSize * sz);
        building_img.setDisplaySize(this.tileSize * sz, this.tileSize * sz);
        
        building_img.setData("global_id", buildingData.global_id);
        building_img.setData("type_id", buildingData.type_id);
        
        building_img.setData("baseStats", baseStats); 
        // Store stats for UI
        
        building_img.setInteractive();
        this.input.setDraggable(building_img);
        this.buildingGroup.add(building_img);

        // --- Click Logic ---
        building_img.on('pointerup', (pointer) => {
            if (this.isDraggingBuilding) return;
            const dist = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
            if (dist < 5) {
                this.selectBuilding(building_img);
            }
        });
    }


    createActionMenu() {
        // Container floats in the game world attached to the building
        this.actionMenu = this.add.container(0, 0).setDepth(50).setVisible(false);

        // Info Button (Blue)
        const infoBg = this.add.circle(-40, 0, 25, 0x2980b9).setInteractive({ useHandCursor: true });
        infoBg.setStrokeStyle(3, 0x1a0f0a);
        const infoIcon = this.add.text(-40, 0, "i", { fontFamily: 'Georgia', fontSize: '28px', color: '#fff', fontStyle: 'bold italic' }).setOrigin(0.5);
        
        infoBg.on('pointerdown', (pointer, lx, ly, ev) => {
            ev.stopPropagation();
            this.showInfoPopup();
        });

        // Upgrade Button (Green / Grey)
        this.upgradeBg = this.add.rectangle(40, 0, 100, 50, 0x27ae60).setInteractive({ useHandCursor: true });
        this.upgradeBg.setStrokeStyle(3, 0x1a0f0a);
        const upgText = this.add.text(40, 0, "UPGRADE", { fontFamily: 'Arial', fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        this.upgradeBg.on('pointerdown', (pointer, lx, ly, ev) => {
            ev.stopPropagation();
            if (this.nextLevelData) {
                this.showUpgradePopup();
            }
        });

        this.actionMenu.add([infoBg, infoIcon, this.upgradeBg, upgText]);
    }

    selectBuilding(sprite) {
        this.selectedBuilding = sprite;
        const stats = sprite.getData('baseStats');

        // Position menu below the building
        this.actionMenu.setPosition(sprite.x + (sprite.displayWidth / 2), sprite.y + sprite.displayHeight + 35);
        this.actionMenu.setVisible(true);

        // Find Next Level
        this.nextLevelData = gameinfo.info.buildings_master_table.find(b => 
            b.building_name === stats.building_name && b.building_level === stats.building_level + 1
        );

        // Check if upgrade is allowed based on TH Level
        const currentTH = resources.residenceLevel;
        let canUpgrade = false;

        if (this.nextLevelData && this.nextLevelData.unlock_level <= currentTH) {
            canUpgrade = true;
        }

        if (canUpgrade) {
            this.upgradeBg.setFillStyle(0x27ae60); // Green
            this.nextLevelData = this.nextLevelData; // Keep it
        } else {
            this.upgradeBg.setFillStyle(0x7f8c8d); // Grey
            this.nextLevelData = null; // Disable click action
        }
    }


    createInfoPopup() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.infoPopup = this.add.container(width / 2, height / 2).setDepth(100).setScrollFactor(0).setVisible(false);

        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setInteractive();
        backdrop.on('pointerdown', () => this.infoPopup.setVisible(false));

        const panel = this.add.rectangle(0, 0, 500, 400, 0x3e2723).setStrokeStyle(6, 0x1a0f0a);
        
        const closeBtn = this.add.circle(220, -170, 18, 0xc0392b).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
        this.add.text(220, -170, "X", { fontFamily: 'Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.infoPopup.setVisible(false));

        this.infoTitle = this.add.text(0, -150, "", { fontFamily: 'Georgia', fontSize: '32px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(0.5);
        this.infoDesc = this.add.text(0, -90, "", { fontFamily: 'Arial', fontSize: '18px', color: '#e0d6cc', wordWrap: { width: 440 }, align: 'center' }).setOrigin(0.5, 0);
        
        // Dynamic Stats Area
        this.statsText = this.add.text(-200, 20, "", { fontFamily: 'Courier New', fontSize: '22px', color: '#ffffff', lineSpacing: 15 }).setOrigin(0, 0);

        this.infoPopup.add([backdrop, panel, closeBtn, this.infoTitle, this.infoDesc, this.statsText]);
    }

    showInfoPopup() {
        if (!this.selectedBuilding) return;
        const stats = this.selectedBuilding.getData('baseStats');

        this.infoTitle.setText(`${stats.building_name.toUpperCase()} (Lvl ${stats.building_level})`);
        this.infoDesc.setText(stats.building_desc);

        let statsString = `HP: ${stats.hp}\n`;

        if (stats.building_type === "defense") {
            statsString += `DPS: ${stats.dps}\nRange: ${stats.defense_range}`;
        } else if (stats.building_type === "storage") {
            statsString += `Capacity: ${stats.storage_capacity}`;
        } else if (stats.building_type === "collector") {
            statsString += `Production: ${stats.production_rate}/hr\nCapacity: ${stats.storage_capacity}`;
        }

        this.statsText.setText(statsString);
        this.infoPopup.setVisible(true);
        this.actionMenu.setVisible(false);
    }

    createUpgradePopup() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.upgradePopup = this.add.container(width / 2, height / 2).setDepth(100).setScrollFactor(0).setVisible(false);

        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setInteractive();
        backdrop.on('pointerdown', () => this.upgradePopup.setVisible(false));

        const panel = this.add.rectangle(0, 0, 450, 300, 0x3e2723).setStrokeStyle(6, 0x1a0f0a);

        const closeBtn = this.add.circle(190, -120, 18, 0xc0392b).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
        this.add.text(190, -120, "X", { fontFamily: 'Arial', fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.upgradePopup.setVisible(false));

        this.upgTitle = this.add.text(0, -100, "", { fontFamily: 'Georgia', fontSize: '28px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(0.5);
        const chooseText = this.add.text(0, -50, "Choose resource", { fontFamily: 'Georgia', fontSize: '24px', color: '#ffd54f', fontStyle: 'bold' }).setOrigin(0.5);

        // Oil Upgrade Button
        const oilBtn = this.add.rectangle(-100, 30, 160, 60, 0x34495e).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
        this.oilCostText = this.add.text(-100, 30, "", { fontFamily: 'Courier New', fontSize: '22px', color: '#3498db', fontStyle: 'bold' }).setOrigin(0.5);

        oilBtn.on('pointerdown', async () => {
            if (resources.oil < this.nextLevelData.upgrade_cost){
                window.phaserGame.scene.run('ErrorScene', { message : "Insufficient resources for the upgrade." });
                return;
            }
            const upgradeInfo = {
                global_id: this.selectedBuilding.getData('global_id'),
                resource: 'oil'
            }
            if(await upgradeBuilding(upgradeInfo)){
                this.upgradeBuilding(upgradeInfo);
            }
            this.upgradePopup.setVisible(false);
        });

        // Gem Upgrade Button
        const gemBtn = this.add.rectangle(100, 30, 160, 60, 0x27ae60).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
        this.gemCostText = this.add.text(100, 30, "", { fontFamily: 'Courier New', fontSize: '22px', color: '#2ecc71', fontStyle: 'bold' }).setOrigin(0.5);

        gemBtn.on('pointerdown', async () => {
            if (resources.gems < Math.floor(this.nextLevelData.upgrade_cost / 100)){
                window.phaserGame.scene.run('ErrorScene', { message : "Insufficient resources for the upgrade." });
                return;
            }
            const upgradeInfo = {
                global_id: this.selectedBuilding.getData('global_id'),
                resource: 'gems'
            }
            if(await upgradeBuilding(upgradeInfo)){
                this.upgradeBuilding(upgradeInfo);
            }
            //reduce oil in frontend
            //if storage type building then update the corresponding storage capacity
            //update building data in village layout
            this.upgradePopup.setVisible(false);
        });

        this.upgradePopup.add([backdrop, panel, closeBtn, this.upgTitle, oilBtn, this.oilCostText, gemBtn, this.gemCostText, chooseText]);
    }

    upgradeBuilding(upgradeInfo){
        const globalID = upgradeInfo.global_id;
        const resource = upgradeInfo.resource;
        if( resource === 'gems' ){
            resources.gems -= Math.floor(this.nextLevelData.upgrade_cost / 100);
        }
        else {
            resources.oil -= this.nextLevelData.upgrade_cost;
        }
        const building = this.selectedBuilding;
        building.incData('type_id',1);
        const newStats = this.enrichBuildingData(building.getData('type_id'))
        const oldStats = building.getData('baseStats');
        building.setData('baseStats', newStats);
        if(newStats.building_type === 'storage'){
            if(newStats.building_name !== 'Mercenary-Camp'){
                resources.oilCap += (newStats.storage_capacity - oldStats.storage_capacity);
            }
            else{
                 resources.armyCap += (newStats.storage_capacity - oldStats.storage_capacity);
            }
        }
        if(newStats.building_name === 'Residence'){
            resources.residenceLevel++;
        }
        building.setTexture('buildings',`${newStats.building_name}${newStats.building_level}`);
    }
    
    

    showUpgradePopup() {
        if (!this.nextLevelData) return;

        this.upgTitle.setText(`Upgrade to Level ${this.nextLevelData.building_level}`);
        
        // Assuming your backend sends these fields. Adjust names if needed.
        const oilCost = this.nextLevelData.upgrade_cost;
        const gemCost = Math.floor(oilCost/100);

        this.oilCostText.setText(`🛢️ ${oilCost}`);
        this.gemCostText.setText(`💎 ${gemCost}`);

        this.upgradePopup.setVisible(true);
        this.actionMenu.setVisible(false);
    }
}