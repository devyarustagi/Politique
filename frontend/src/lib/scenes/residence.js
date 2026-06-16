import Phaser from "phaser";
import grassUrl from '$lib/assets/grass.png';
import mapUrl from '$lib/assets/map.json?url';
import { gameinfo } from '$lib/gameState.svelte';
import { moveBuilding } from "$lib/api/moveBuilding";

export class ResidenceScene extends Phaser.Scene {
        constructor() {
            super('ResidenceScene');
        }

        preload() {
            this.load.image('grass_img', grassUrl); 
            this.load.tilemapTiledJSON('my_map', mapUrl);
            this.load.setPath('assets/');
            this.load.atlasPCT('buildings', 'atlas.pct');
            this.load.setPath();
        }

        create() {
            const map = this.make.tilemap({ key: 'my_map' });
            const tileset = map.addTilesetImage('grass', 'grass_img');
            const layer = map.createLayer('Tile Layer 1', tileset, 0, 0);
            const tileSize = 32;
            this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
            let isDraggingBuilding = false;
            this.buildingGroup = this.add.group({
                classType: Phaser.GameObjects.Image,
            })
            const hitbox = this.add.rectangle(0, 0, 32, 32, 0x00FF00, 0.5);
            hitbox.setOrigin(0, 0);
            hitbox.setVisible(false);
            this.input.on('dragstart', (pointer, gameObject) => { 
                isDraggingBuilding = true;
                gameObject.setData('startX', gameObject.x);
                gameObject.setData('startY', gameObject.y);
                hitbox.x = gameObject.x;
                hitbox.y = gameObject.y;
                hitbox.setDisplaySize(gameObject.displayWidth, gameObject.displayHeight);
                hitbox.setVisible(true);                
             });
            this.input.on('dragend', (pointer, gameObject) => { 
                isDraggingBuilding = false; 
                hitbox.setVisible(false);
                if (gameObject.getData('isValid') === false) {
                    gameObject.x = gameObject.getData('startX');
                    gameObject.y = gameObject.getData('startY');
                }
                const promise = moveBuilding(gameObject.getData("global_id"), Math.floor(gameObject.x / tileSize), Math.floor(gameObject.y / tileSize));
                promise.then(ok => 
                    {
                        if (!ok) 
                        {
                            gameObject.x = gameObject.getData('startX');
                            gameObject.y = gameObject.getData('startY');                    
                        }
                    }
                )
                hitbox.fillColor = 0x00FF00;
            });

            this.input.on('pointermove', (pointer) => {
                if (!pointer.isDown || isDraggingBuilding) return;
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            });
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
                const cam = this.cameras.main;
                const newZoom = cam.zoom - (deltaY * 0.01); 
                cam.setZoom(Phaser.Math.Clamp(newZoom, 1, 4));
            });

            gameinfo.info.village_layout.forEach((buildingData) => {
                const pixelX = buildingData.x_coordinate * tileSize;
                const pixelY = buildingData.y_coordinate * tileSize;
                const building = gameinfo.info.buildings_master_table[(buildingData.type_id)-1];
                const building_img = this.add.image(pixelX, pixelY, 'buildings', `${building.building_name}${building.building_level}`);
                building_img.setOrigin(0);
                const sz = building.tile_count;
                building_img.setSize(tileSize*sz,tileSize*sz);
                console.log(building_img.height);
                building_img.setData("global_id", buildingData.global_id);
                building_img.setData("type_id", buildingData.type_id);
                building_img.setDisplaySize(tileSize*sz,tileSize*sz); 
                building_img.setInteractive();
                this.input.setDraggable(building_img);
                this.buildingGroup.add(building_img);
            });

            this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
                const snappedX = Math.floor(dragX / tileSize) * tileSize;
                const snappedY = Math.floor(dragY / tileSize) * tileSize;
                gameObject.x = snappedX;
                gameObject.y = snappedY;
                hitbox.x = snappedX;
                hitbox.y = snappedY;
                let isOverlapping = false;
                const objBounds = gameObject.getBounds();
                const allBuildings = this.buildingGroup.getChildren(); 
                Phaser.Geom.Rectangle.Inflate(objBounds, -1, -1);
                if (hitbox.x < 0 || hitbox.x + hitbox.displayWidth > map.widthInPixels){
                    isOverlapping = true;
                }
                else if ( hitbox.y < 0 || hitbox.y + hitbox.displayHeight > map.heightInPixels){
                    isOverlapping = true;
                }
                else {
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
        }    
    }