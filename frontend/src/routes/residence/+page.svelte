<script>
    import { onMount, onDestroy } from 'svelte';
    import Phaser from 'phaser';
    import grassUrl from '$lib/assets/grass.png';
    import mapUrl from '$lib/assets/map.json?url';
    import { gameinfo } from '$lib/gameState.svelte';

    let gameContainer;
    let game;

    class ResidenceScene extends Phaser.Scene {
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
                const pixelX = (buildingData.x_coordinate * tileSize) + (tileSize / 2);
                const pixelY = (buildingData.y_coordinate * tileSize) + (tileSize / 2);
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

                for (const otherBuilding of allBuildings) {
                    if (otherBuilding === gameObject) continue; 
                    if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, otherBuilding.getBounds())) {
                        isOverlapping = true;
                        break; 
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
      
    onMount(() => {
        const config = {
            type: Phaser.AUTO,
            backgroundColor: "#71e026",
            width: 1408, 
            height: 1408,
            title: "Politique",
            parent: gameContainer,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            pixelArt: true, 
            scene: [ResidenceScene]
            }
        game = new Phaser.Game(config);
        });
    onDestroy(() => {
        if (game) {
            game.destroy(true);
        }
    });
</script>

<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    :global(canvas) {
        display: block; 
    }
</style>

<div bind:this={gameContainer} style="
    position: absolute;
    top:0;
    left:0;
    box-sizing: border-box; 
    height: 100%; 
    width: 100%; 
    background-color: #FFF;">
</div>