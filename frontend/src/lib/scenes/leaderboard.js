import Phaser from "phaser";
import { getLeaderboardData } from "$lib/api/leaderboard";

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super('LeaderboardScene');
    }

    init(data) {
        this.percentile = data.user_percentile || 0;
        this.leaderboardRows = data.leaderboard_rows || [];
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

        // 2. Main Wooden Panel (Outer Frame)
        const panelWidth = 1000;
        const panelHeight = 800;
        const panelX = width / 2;
        const panelY = height / 2;

        const woodBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x5c4033, 1);
        woodBg.setStrokeStyle(10, 0x2e1a11);

        // 3. Header Texts & Close Button
        this.add.text(width / 2, panelY - panelHeight / 2 + 50, "GLOBAL LEADERBOARD", {
            fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '48px', color: '#ffd54f', fontStyle: 'bold',
            stroke: '#1a0f0a', strokeThickness: 6, shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        const closeBtn = this.add.circle(panelX + panelWidth / 2 - 40, panelY - panelHeight / 2 + 40, 25, 0xc0392b, 1)
            .setStrokeStyle(4, 0x1a0f0a)
            .setInteractive({ useHandCursor: true });
        this.add.text(panelX + panelWidth / 2 - 40, panelY - panelHeight / 2 + 40, "X", {
            fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            // Resume or start whatever scene called this one
            if (this.scene.isActive('ResidenceScene')) {
                this.scene.resume('ResidenceScene');
            } else {
                this.scene.start('ResidenceScene'); 
            }
        });
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xe74c3c));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0xc0392b));

        // 4. Column Headers
        const headerY = panelY - panelHeight / 2 + 130;
        const colStyle = { fontFamily: 'Arial', fontSize: '22px', color: '#bfae9c', fontStyle: 'bold' };
        
        // Setup X coordinates for columns (relative to center)
        const cRank = panelX - panelWidth/2 + 75;
        const cName = cRank + 125;
        const cAttacks = cName + 225;
        const cDefenses = cAttacks + 210;
        const cKarma = cDefenses + 220;

        this.add.text(cRank, headerY, "RANK", colStyle).setOrigin(0, 0.5);
        this.add.text(cName, headerY, "PLAYER", colStyle).setOrigin(0, 0.5);
        this.add.text(cAttacks, headerY, "ATTACKS WON", colStyle).setOrigin(0.5, 0.5);
        this.add.text(cDefenses, headerY, "DEFENSES WON", colStyle).setOrigin(0.5, 0.5);
        this.add.text(cKarma, headerY, "KARMA", colStyle).setOrigin(1, 0.5);

        // Divider Line
        this.add.rectangle(panelX, headerY + 25, panelWidth - 80, 4, 0x2e1a11);

        // 5. Fixed Bottom Panel (Percentile)
        const bottomPanelHeight = 90;
        const bottomPanelY = panelY + panelHeight / 2 - bottomPanelHeight / 2 - 20;
        
        const bottomWoodBg = this.add.rectangle(panelX, bottomPanelY, panelWidth - 60, bottomPanelHeight, 0x3e2723, 1);
        bottomWoodBg.setStrokeStyle(4, 0x1a0f0a);
        this.percentile = 100.00 - this.percentile;
        if(this.percentile === 0) this.percentile = 0.01;
        if(this.percentile === 100) this.percentile = 99.99;
        this.add.text(panelX, bottomPanelY, `YOUR STANDING: TOP ${this.percentile}% GLOBALLY`, {
            fontFamily: 'Courier New, monospace', fontSize: '32px', color: '#27ae60', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        // 6. SCROLLABLE LIST AREA
        this.createScrollableList(panelX, headerY + 40, panelWidth - 80, panelHeight - 270, cRank, cName, cAttacks, cDefenses, cKarma);
    }

    createScrollableList(x, y, width, height, cRank, cName, cAttacks, cDefenses, cKarma) {
        // Create the mask graphics
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff);
        // We draw the mask rectangle from top-left, so we calculate X and Y
        graphics.fillRect(x - width / 2, y, width, height);
        const mask = new Phaser.Display.Masks.GeometryMask(this, graphics);

        // The container holds all the rows
        this.listContainer = this.add.container(0, y);
        this.listContainer.setMask(mask);

        const rowHeight = 70;
        let currentY = 0;

        // Generate Rows
        this.leaderboardRows.forEach((row, index) => {
            // Alternating row background for readability
            const bgColor = index % 2 === 0 ? 0x4e342e : 0x5c4033;
            const rowBg = this.add.rectangle(x, currentY + rowHeight / 2, width, rowHeight, bgColor, 1);
            
            // Highlight top 3 with special colors
            let rankColor = '#ffffff';
            if (row.rank === 1) rankColor = '#f1c40f'; // Gold
            if (row.rank === 2) rankColor = '#bdc3c7'; // Silver
            if (row.rank === 3) rankColor = '#cd7f32'; // Bronze

            const textStyle = { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' };

            const rankTxt = this.add.text(cRank, currentY + rowHeight / 2, `#${row.rank}`, { ...textStyle, color: rankColor, fontSize: '28px' }).setOrigin(0, 0.5);
            const nameTxt = this.add.text(cName, currentY + rowHeight / 2, row.username.toUpperCase(), textStyle).setOrigin(0, 0.5);
            const attacksTxt = this.add.text(cAttacks, currentY + rowHeight / 2, `${row.attacks_won} / ${row.total_attacks}`, textStyle).setOrigin(0.5, 0.5);
            const defensesTxt = this.add.text(cDefenses, currentY + rowHeight / 2, `${row.defenses_won} / ${row.total_defenses}`, textStyle).setOrigin(0.5, 0.5);
            
            const karmaStyle = { fontFamily: 'Courier New', fontSize: '26px', color: '#ffd54f', fontStyle: 'bold' };
            const karmaTxt = this.add.text(cKarma, currentY + rowHeight / 2, `💀 ${row.karma}`, karmaStyle).setOrigin(1, 0.5);

            this.listContainer.add([rowBg, rankTxt, nameTxt, attacksTxt, defensesTxt, karmaTxt]);
            
            currentY += rowHeight;
        });

        // 7. Scrolling Logic
        // Calculate max scroll bounds
        const totalListHeight = currentY;
        const maxScroll = Math.min(0, height - totalListHeight); // If list is shorter than mask, don't allow scrolling
        
        // Define base Y of container
        const baseY = y;
        let currentScroll = 0;

        // Mouse Wheel Scroll
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            currentScroll -= deltaY * 0.5; // Adjust multiplier for scroll speed
            currentScroll = Phaser.Math.Clamp(currentScroll, maxScroll, 0);
            this.listContainer.y = baseY + currentScroll;
        });

        // Drag Scroll (For touch screens / mouse drag)
        let isDragging = false;
        let startY = 0;
        let startScroll = 0;

        // Create a hit area over the masked region to capture drag events
        const hitArea = this.add.rectangle(x, y + height / 2, width, height, 0x000000, 0).setInteractive();

        hitArea.on('pointerdown', (pointer) => {
            isDragging = true;
            startY = pointer.y;
            startScroll = currentScroll;
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const delta = pointer.y - startY;
                currentScroll = startScroll + delta;
                currentScroll = Phaser.Math.Clamp(currentScroll, maxScroll, 0);
                this.listContainer.y = baseY + currentScroll;
            }
        });
    }
}