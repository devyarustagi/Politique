import Phaser from "phaser";
import { resources } from "$lib/gameState.svelte";
import { addBuilding } from "$lib/api/addBuilding";
import { gameinfo } from "$lib/gameState.svelte";
export class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    init(data) {
        this.availableItems = data.items || []; 
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        bg.setOrigin(0, 0);
        bg.setInteractive(); 

        this.add.text(width / 2, 50, "SHOP", { 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '64px', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5).setDepth(10);

        const closeBtn = this.add.text(width - 50, 50, "❌", { fontSize: '32px' }).setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            this.scene.stop(); // Stop the shop scene
            this.scene.resume('ResidenceScene'); // Unpause the main game
        });

        // 3. Dynamically Layout the Shop Items
        this.createShopGrid();
    }

    createShopGrid() {
        const startX = 200;
        const startY = 250;
        const spacingX = 250;
        const spacingY = 300;
        let columns = 5;

        this.availableItems.forEach((item, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            
            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);


            const itemContainer = this.add.container(x, y);

            const cardBg = this.add.rectangle(0, 0, 200, 250, 0x333333, 1);
            cardBg.setStrokeStyle(4, 0x555555);

            const img = this.add.image(0, -30, 'buildings', item.textureKey);
            img.setDisplaySize(100, 100);

            const nameText = this.add.text(0, -100, item.name, {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            let c, buttonColor, interact;
            if (item.cost > resources.oil ){
                c = '#ff0000';
                buttonColor = 0x6a788f;
                interact = false;
            }
            else {
                c = '#00ff00';
                buttonColor = 0x2ecc71;
                interact = true;
            }
            const costText = this.add.text(0, 40, `💧 ${item.cost}`, {
                fontSize: '24px',
                color: c, // Light purple for oil
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Buy Button
            const buyBtnBg = this.add.rectangle(0, 90, 120, 40, buttonColor, 1);
            if (interact) buyBtnBg.setInteractive({ useHandCursor: true });
            
            const buyBtnText = this.add.text(0, 90, "BUILD", { fontSize: '18px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5);

            // Buy Click Logic
            buyBtnBg.on('pointerdown', async () => {
                console.log(item.id);
                const response = await this.handlePurchase(item);
                if( response === false ){ //response is an item building
                    alert("Sorry, the new building could not be made. Pls try again.")
                }
                else{
                    resources.oil -= response.cost;
                    const building = gameinfo.info.buildings_master_table[response.id-1];
                    if(building.building_type === "storage"){
                        gameinfo.info.storages.forEach(b => {
                            if( b.building_id === building.building_id ){
                                if(building.building_name !== "Mercenary-Camp"){
                                    resources.oilCap += b.storage_capacity;
                                }
                                else{
                                    resources.armyCap += b.storage_capacity;
                                }
                            } 
                            })
                    }
                }
                this.scene.stop();
                const ResidenceScene = this.scene.get("ResidenceScene");
                ResidenceScene.scene.resume();
            });
            // Button hover effect
            buyBtnBg.on('pointerover', () => buyBtnBg.setFillStyle(0x27ae60));
            buyBtnBg.on('pointerout', () => buyBtnBg.setFillStyle(0x2ecc71));

            // Assemble the container
            itemContainer.add([cardBg, img, nameText, costText, buyBtnBg, buyBtnText]);
        });
    }

    async handlePurchase(item) {
        const ResidenceScene = this.scene.get("ResidenceScene");
        const coords = ResidenceScene.findEmptySpot(item.id);
        if ( coords === null ){
            alert("New building could not be added due to lack of space on map.");
            return;
        }
        const response = await addBuilding({
            x_coordinate: coords.x_coordinate,
            y_coordinate: coords.y_coordinate,
            building_id: item.id,
            resource: "oil"
        })
        if(response) {
            ResidenceScene.addNewBuilding({
                x_coordinate: coords.x_coordinate,
                y_coordinate: coords.y_coordinate,
                type_id: item.id,
                global_id: response.global_id
            });
            return item;
        }
        else{
            return false;
        }

    }
}