<script>
    import { onMount, onDestroy } from 'svelte';
    import Phaser from 'phaser';
    import grassUrl from '$lib/assets/grass.png';
    import mapUrl from '$lib/assets/map.json?url';
    import { gameinfo } from '$lib/gameState.svelte';

    let gameContainer;
    let game;
    $inspect(gameinfo);
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
        gameinfo.info.village_layout.forEach((buildingData) => {
        
        // Convert the Grid X/Y into exact Pixel X/Y for the center of the tile
        console.log(buildingData.x_coordinate);
        const pixelX = (buildingData.x_coordinate * tileSize) + (tileSize / 2);
        const pixelY = (buildingData.y_coordinate * tileSize) + (tileSize / 2);

        // Add the image. Notice we don't save this to a global variable!
        // We just use a temporary 'building' variable for this single iteration.
        const building = gameinfo.info.buildings_master_table[(buildingData.type_id)-1];
        const building_img = this.add.image(pixelX, pixelY, 'buildings', `${building.building_name}${building.building_level}`);
        building_img.setOrigin(0.5, 0.5);

        // Make it interactive and draggable
        building_img.setInteractive();
        this.input.setDraggable(building_img);
    });

    // 4. The Global Drag Event (with Grid Snapping)
    // This listens for ANY draggable object being moved
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        
        // The Snapping Math!
        // 1. Divide the mouse pixel by 32
        // 2. Floor it to chop off the decimals (finding the raw column/row)
        // 3. Multiply back by 32 to get the pixel coordinate of the top-left of the tile
        // 4. Add 16 (tileSize / 2) to shift the building to the dead-center of the tile
        
        const snappedX = Math.floor(dragX / tileSize) * tileSize + (tileSize / 2);
        const snappedY = Math.floor(dragY / tileSize) * tileSize + (tileSize / 2);

        // Apply the snapped coordinates to the building
        gameObject.x = snappedX;
        gameObject.y = snappedY;
    });
        // 4. Tell Phaser what to do when you drag an object
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });        
        }    
    }
      
    onMount(() => {
        const config = {
            type: Phaser.AUTO,
            width: 1280, 
            height: 1280, 
            title: "Politique",
            parent: gameContainer,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
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

<div bind:this={gameContainer} style="width: 100vw; height: 100vh; overflow: hidden; background-color: #FFF;"></div>