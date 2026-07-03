import Phaser from "phaser";

export class BattleUIScene extends Phaser.Scene {
    constructor() {
        super('BattleUIScene');
    }

    init(data) {
        this.battleScene = data.battleScene;
        this.timeLeft = 120;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(20, 20, 320, 110, 0x000000, 0.6).setOrigin(0, 0);
        
        this.add.text(35, 30, `DEFENDING: ${this.battleScene.defenderName}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.add.text(35, 60, `💀 Karma: ${this.battleScene.defenderKarma}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#bdc3c7', fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.add.text(35, 90, `🛢️ Loot Available: ${this.battleScene.lootAvailable}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#bdc3c7', fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.add.rectangle(width / 2, 20, 160, 50, 0x000000, 0.6).setOrigin(0.5, 0);
        this.timerText = this.add.text(width / 2, 45, "02:00", {
            fontFamily: 'Courier New, monospace', fontSize: '30px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const endBtn = this.add.rectangle(width - 20, 20, 180, 50, 0xc0392b, 1).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        endBtn.setStrokeStyle(3, 0xffffff);
        this.add.text(width - 110, 45, "END BATTLE", {
            fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // FIX: Re-route early exits to the battle conclusion logic
        endBtn.on('pointerdown', () => this.battleScene.concludeBattle());

        this.createDeploymentBar(width, height);

        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
    }

    createDeploymentBar(screenWidth, screenHeight) {
        const barHeight = 120;
        const barY = screenHeight - barHeight;
        
        this.add.rectangle(0, barY, screenWidth, barHeight, 0x222222, 0.85).setOrigin(0, 0);

        const cardWidth = 90;
        const spacing = 110;
        const startX = (screenWidth / 2) - ((this.battleScene.playerArmy.length - 1) * spacing / 2);

        this.troopCards = [];

        this.battleScene.playerArmy.forEach((troop, idx) => {
            const x = startX + (idx * spacing);
            const y = barY + (barHeight / 2);

            const cardBg = this.add.rectangle(x, y, cardWidth, 100, 0x5c4033, 1).setInteractive({ useHandCursor: true });
            cardBg.setStrokeStyle(3, 0x1a0f0a);

            const textureName = `${troop.mercenary_name}Card`;
            this.add.image(x, y - 10, 'mercenaries', textureName).setDisplaySize(60, 60);

            const countBg = this.add.circle(x + 35, y - 35, 15, 0xc0392b, 1).setStrokeStyle(2, 0xffffff);
            const countText = this.add.text(x + 35, y - 35, `${troop.count}`, {
                fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            cardBg.on('pointerdown', (pointer, lx, ly, event) => {
                event.stopPropagation(); 
                this.selectTroop(idx);
            });

            this.troopCards.push({ bg: cardBg, countText: countText, countBg: countBg });
            
            if(troop.count <= 0) {
                countBg.setFillStyle(0x7f8c8d);
                cardBg.setAlpha(0.5);
            }
        });
    }

    selectTroop(index) {
        this.clearSelection();
        if (this.battleScene.playerArmy[index].count <= 0) return;

        this.battleScene.selectedTroopIndex = index;

        const card = this.troopCards[index];
        card.bg.setStrokeStyle(4, 0x27ae60);
        card.bg.fillColor = 0x8d6e63;
    }

    clearSelection() {
        if (this.battleScene.selectedTroopIndex !== null) {
            const prevCard = this.troopCards[this.battleScene.selectedTroopIndex];
            prevCard.bg.setStrokeStyle(3, 0x1a0f0a);
            prevCard.bg.fillColor = 0x5c4033;
        }
        this.battleScene.selectedTroopIndex = null;
    }

    updateTroopCardUI(index) {
        const cardUI = this.troopCards[index];
        const currentCount = this.battleScene.playerArmy[index].count;
        
        cardUI.countText.setText(`${currentCount}`);

        if (currentCount <= 0) {
            cardUI.countBg.setFillStyle(0x7f8c8d);
            cardUI.bg.setAlpha(0.5);
        }
    }

    updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
            const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
            
            this.timerText.setText(`${minutes}:${seconds}`);
            if (this.timeLeft <= 30) this.timerText.setColor('#ff4444');
        } else {
            this.battleScene.concludeBattle();
        }
    }
}