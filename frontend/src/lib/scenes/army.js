import Phaser from "phaser";
import { resources, gameinfo, userArmy } from "$lib/gameState.svelte";
import { trainArmy } from "$lib/api/trainArmy";
import { startBattle } from "$lib/api/startBattle";

export class ChooseArmyScene extends Phaser.Scene {
    constructor() {
        super('ChooseArmyScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Dark semi-transparent overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0, 0);

        // 2. Main Wooden Panel
        const panelWidth = 1200;
        const panelHeight = 900;
        const panelX = width / 2;
        const panelY = height / 2;

        const woodBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x5c4033, 1);
        woodBg.setStrokeStyle(10, 0x2e1a11);

        const innerWoodBg = this.add.rectangle(panelX, panelY + 20, panelWidth - 60, panelHeight - 180, 0x3e2723, 1);
        innerWoodBg.setStrokeStyle(4, 0x1a0f0a);

        // 3. Header Texts
        this.add.text(width / 2, panelY - panelHeight / 2 + 40, "MUSTER YOUR FORCES", {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '52px',
            color: '#ffd54f',
            fontStyle: 'bold',
            stroke: '#1a0f0a',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5);

        this.capacityText = this.add.text(width / 2, panelY - panelHeight / 2 + 80, "", {
            fontFamily: 'Arial, sans-serif',
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.updateCapacityText();

        // 4. Generate the Troop Cards
        this.createTroopGrid(panelX, panelY);

        // 5. Action Buttons (Cancel & Battle)
        this.createActionButtons(panelX, panelY + panelHeight / 2 - 60);

        // 6. Info popup layer
        this.createInfoPopup();
    }

    updateCount(idx, amount) {
        const name = userArmy[idx].mercenary_name;
        while (idx < userArmy.length && userArmy[idx].mercenary_name === name) {
            userArmy[idx].count += amount;
            idx += 1;
        }
    }

    createTroopGrid(centerX, centerY) {
        const cardWidth = 240;
        const spacingX = 270;
        const spacingY = 320;
        const columns = 4;

        const totalGridWidth = (columns - 1) * spacingX;
        const startX = centerX - (totalGridWidth / 2);
        const startY = centerY - 160; 
        let index = -1;
        
        userArmy.forEach((troop, idx) => {
            if (troop.unlock_level !== resources.residenceLevel) {
                return; 
            }
            index += 1;
            
            const row = Math.floor(index / columns);
            const col = index % columns;

            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);

            const cardContainer = this.add.container(x, y);

            // Card Background
            const cardBg = this.add.rectangle(0, 0, cardWidth, 280, 0xd7ccc8, 1);
            cardBg.setStrokeStyle(4, 0x4e342e);

            // Troop Image
            const textureName = `${troop.mercenary_name}Card`;
            const img = this.add.image(0, -35, 'mercenaries', textureName);
            img.setDisplaySize(100, 100);

            // Troop Name
            const nameText = this.add.text(0, -115, troop.mercenary_name.toUpperCase(), {
                fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#3e2723', fontStyle: '900'
            }).setOrigin(0.5);

            // --- Info ('i') Button ---
            const infoBtn = this.add.circle(cardWidth / 2 - 20, -cardWidth / 2 + 20, 16, 0x1565c0, 1)
                .setStrokeStyle(2, 0x0d3a66)
                .setInteractive({ useHandCursor: true });
            const infoIcon = this.add.text(cardWidth / 2 - 20, -cardWidth / 2 + 20, "i", {
                fontFamily: 'Georgia, serif', fontSize: '20px', color: '#ffffff', fontStyle: 'bold italic'
            }).setOrigin(0.5);

            infoBtn.on('pointerdown', (pointer, lx, ly, event) => {
                event.stopPropagation();
                this.showInfoPopup(troop);
            });
            infoBtn.on('pointerover', () => infoBtn.setFillStyle(0x1e88e5));
            infoBtn.on('pointerout', () => infoBtn.setFillStyle(0x1565c0));

            // --- Controls Panel ---
            const controlsBg = this.add.rectangle(0, 70, 200, 50, 0x4e342e, 1);
            controlsBg.setStrokeStyle(2, 0x2e1a11);

            const qtyText = this.add.text(0, 70, `${troop.count}`, {
                fontFamily: 'Courier New, monospace', fontSize: '26px', color: '#ffd54f', fontStyle: 'bold'
            }).setOrigin(0.5);

            const minusBtn = this.add.rectangle(-75, 70, 40, 40, 0xc0392b, 1).setInteractive({ useHandCursor: true });
            minusBtn.setStrokeStyle(3, 0x1a0f0a);
            const minusIcon = this.add.text(-75, 70, "-", { fontSize: '32px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

            const plusBtn = this.add.rectangle(75, 70, 40, 40, 0x27ae60, 1).setInteractive({ useHandCursor: true });
            plusBtn.setStrokeStyle(3, 0x1a0f0a);
            const plusIcon = this.add.text(75, 70, "+", { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

            // --- Button Logic ---
            minusBtn.on('pointerdown', () => {
                if (troop.count > 0) {
                    this.updateCount(idx, -1);
                    resources.armySz -= troop.housing_space;

                    qtyText.setText(`${troop.count}`);
                    this.updateCapacityText();

                    minusBtn.y += 2; minusIcon.y += 2;
                    this.time.delayedCall(100, () => { minusBtn.y -= 2; minusIcon.y -= 2; });
                }
            });

            plusBtn.on('pointerdown', () => {
                if ((resources.armySz + troop.housing_space) <= resources.armyCap) {
                    this.updateCount(idx, 1);
                    resources.armySz += troop.housing_space;

                    qtyText.setText(`${troop.count}`);
                    this.updateCapacityText();

                    plusBtn.y += 2; plusIcon.y += 2;
                    this.time.delayedCall(100, () => { plusBtn.y -= 2; plusIcon.y -= 2; });
                } else {
                    this.capacityText.setTint(0xff4444);
                    this.time.delayedCall(200, () => this.capacityText.clearTint());
                }
            });

            minusBtn.on('pointerover', () => minusBtn.setFillStyle(0xe74c3c));
            minusBtn.on('pointerout', () => minusBtn.setFillStyle(0xc0392b));

            plusBtn.on('pointerover', () => plusBtn.setFillStyle(0x2ecc71));
            plusBtn.on('pointerout', () => plusBtn.setFillStyle(0x27ae60));

            cardContainer.add([cardBg, img, nameText, infoBtn, infoIcon, controlsBg, qtyText, minusBtn, minusIcon, plusBtn, plusIcon]);
        });
    }

    createActionButtons(centerX, yPos) {
        // Cancel Button
        this.add.rectangle(centerX - 195, yPos + 5, 220, 70, 0x000000, 0.5);
        const cancelBg = this.add.rectangle(centerX - 200, yPos, 220, 70, 0xc0392b, 1).setInteractive({ useHandCursor: true });
        cancelBg.setStrokeStyle(6, 0x1a0f0a);
        this.add.text(centerX - 200, yPos, "CANCEL", { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        cancelBg.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('ResidenceScene');
        });

        // Battle Button
        this.add.rectangle(centerX + 205, yPos + 5, 220, 70, 0x000000, 0.5);
        const battleBg = this.add.rectangle(centerX + 200, yPos, 220, 70, 0x27ae60, 1).setInteractive({ useHandCursor: true });
        battleBg.setStrokeStyle(6, 0x1a0f0a);
        this.add.text(centerX + 200, yPos, "BATTLE!", { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        battleBg.on('pointerdown', async () => {
            if (resources.armySz === 0) {
                alert("You need at least one troop to battle!");
                return;
            }
            const ok = await trainArmy();
            if(!ok){
                return;
            }
            else{
                
                const opponentData = await startBattle()
                if (opponentData !== false) {
                    this.scene.stop('ChooseArmyScene');
                    this.scene.start('BattleScene', opponentData)
                }
            };
            return;
        });
        

        cancelBg.on('pointerover', () => cancelBg.setFillStyle(0xe74c3c));
        cancelBg.on('pointerout', () => cancelBg.setFillStyle(0xc0392b));

        battleBg.on('pointerover', () => battleBg.setFillStyle(0x2ecc71));
        battleBg.on('pointerout', () => battleBg.setFillStyle(0x27ae60));
    }

    createInfoPopup() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const popupWidth = 800;  
        const popupHeight = 560; 

        this.infoPopupContainer = this.add.container(width / 2, height / 2).setDepth(1000).setVisible(false);

        const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
            .setOrigin(0.5)
            .setInteractive(); 
        backdrop.on('pointerdown', () => this.hideInfoPopup());

        const panelBg = this.add.rectangle(0, 0, popupWidth, popupHeight, 0x3e2723, 1)
            .setStrokeStyle(8, 0x1a0f0a);

        const closeBtn = this.add.circle(popupWidth / 2 - 30, -popupHeight / 2 + 30, 20, 0xc0392b, 1) 
            .setStrokeStyle(3, 0x1a0f0a)
            .setInteractive({ useHandCursor: true });
        const closeIcon = this.add.text(popupWidth / 2 - 30, -popupHeight / 2 + 30, "X", {
            fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.hideInfoPopup());
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xe74c3c));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0xc0392b));


        this.popupNameText = this.add.text(0, -popupHeight / 2 + 50, "", {
            fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '44px', color: '#ffd54f', fontStyle: 'bold', 
            stroke: '#1a0f0a', strokeThickness: 6
        }).setOrigin(0.5);

        const imgFrameX = -popupWidth / 2 + 180; 
        const imgFrameY = -20;
        const imgFrame = this.add.rectangle(imgFrameX, imgFrameY, 260, 260, 0xd7ccc8, 1) 
            .setStrokeStyle(4, 0x1a0f0a);
        this.popupImage = this.add.image(imgFrameX, imgFrameY, 'mercenaries', '').setDisplaySize(220, 220);

        const textX = -popupWidth / 2 + 340; 
        const textTop = -popupHeight / 2 + 130;

        this.popupDescText = this.add.text(textX, textTop, "", {
            fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#e0d6cc', 
            wordWrap: { width: popupWidth - 400 }, lineSpacing: 6
        }).setOrigin(0, 0);

        const statLabelStyle = { fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#bfae9c', fontStyle: 'bold' }; 
        const statValueStyle = { fontFamily: 'Courier New, monospace', fontSize: '22px', color: '#ffd54f', fontStyle: 'bold' }; 

        const statsStartY = textTop + 160; 
        const statRowGap = 40; 
        const statLabels = ["HP", "DPS", "Move speed", "Attack range", "Housing space"];

        this.popupStatLabelTexts = [];
        this.popupStatValueTexts = [];

        statLabels.forEach((label, i) => {
            const rowY = statsStartY + i * statRowGap;
            this.popupStatLabelTexts.push(this.add.text(textX, rowY, `${label}:`, statLabelStyle).setOrigin(0, 0.5));
            this.popupStatValueTexts.push(this.add.text(textX + 220, rowY, "", statValueStyle).setOrigin(0, 0.5)); 
        });

        this.infoPopupContainer.add([
            backdrop, panelBg, closeBtn, closeIcon,
            this.popupNameText, imgFrame, this.popupImage,
            this.popupDescText,
            ...this.popupStatLabelTexts, ...this.popupStatValueTexts
        ]);
    }

    showInfoPopup(troop) {
        this.popupNameText.setText(troop.mercenary_name.toUpperCase());
        this.popupImage.setTexture('mercenaries', `${troop.mercenary_name}${troop.mercenary_level}`);
        this.popupDescText.setText(troop.mercenary_desc || "No description available.");

        const values = [
            troop.hp ?? "—",
            troop.dps ?? "—",
            troop.movement_speed ?? "—",
            troop.mercenary_range ?? "—",
            troop.housing_space ?? "—"
        ];
        
        values.forEach((val, i) => this.popupStatValueTexts[i].setText(`${val}`));

        this.infoPopupContainer.setVisible(true);
    }

    hideInfoPopup() {
        this.infoPopupContainer.setVisible(false);
    }

    updateCapacityText() {
        this.capacityText.setText(`Camp Capacity: ${resources.armySz} / ${resources.armyCap}`);
        if (resources.armySz >= resources.armyCap) {
            this.capacityText.setColor('#ff4444');
        } else {
            this.capacityText.setColor('#ffffff');
        }
    }
}