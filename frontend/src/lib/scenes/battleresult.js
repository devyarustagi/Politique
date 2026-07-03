import { finishBattle } from "$lib/api/finishBattle";
import { resources } from "$lib/gameState.svelte";
import Phaser from "phaser";

export class BattleResultScene extends Phaser.Scene {
    constructor() {
        super('BattleResultScene');
    }

    init(data) {
        this.destruction = data.percent || 0;
        this.karmaWon = data.karma || 0;
        this.oilLooted = data.oil || 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dark overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

        // Result Panel
        const panelWidth = 600;
        const panelHeight = 450;
        const panelBg = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x3e2723, 1);
        panelBg.setStrokeStyle(6, 0x1a0f0a);

        // Title
        this.add.text(width / 2, height / 2 - 170, "BATTLE RESULTS", {
            fontFamily: 'Georgia, serif', fontSize: '46px', color: '#ffd54f', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        // Destruction Percentage
        const color = this.destruction >= 50 ? '#27ae60' : '#c0392b';
        this.add.text(width / 2, height / 2 - 80, `Total Destruction: ${this.destruction}%`, {
            fontFamily: 'Arial, sans-serif', fontSize: '32px', color: color, fontStyle: 'bold'
        }).setOrigin(0.5);

        // Rewards
        this.add.text(width / 2 - 80, height / 2, `💀 Karma Won:`, { fontFamily: 'Arial', fontSize: '28px', color: '#bdc3c7' }).setOrigin(1, 0.5);
        this.add.text(width / 2 - 60, height / 2, `+${this.karmaWon}`, { fontFamily: 'Courier New', fontSize: '32px', color: '#27ae60', fontStyle: 'bold' }).setOrigin(0, 0.5);

        this.add.text(width / 2 - 100, height / 2 + 60, `🛢️ Oil Looted:`, { fontFamily: 'Arial', fontSize: '28px', color: '#bdc3c7' }).setOrigin(1, 0.5);
        this.add.text(width / 2 - 80, height / 2 + 60, `+${this.oilLooted}`, { fontFamily: 'Courier New', fontSize: '32px', color: '#3498db', fontStyle: 'bold' }).setOrigin(0, 0.5);

        // OK Button
        const okBtn = this.add.rectangle(width / 2, height / 2 + 150, 200, 60, 0x27ae60, 1).setInteractive({ useHandCursor: true });
        okBtn.setStrokeStyle(4, 0x1a0f0a);
        this.add.text(width / 2, height / 2 + 150, "RETURN HOME", {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        okBtn.on('pointerdown', async () => {
            const result = {
                karma_gained: this.karmaWon,
                oil_looted: this.oilLooted
            };
            const ok = await finishBattle(result);
            if(ok === true){
                resources.oil += this.oilLooted;
            }
            this.scene.stop();
            this.scene.resume('ResidenceScene');
        });
        okBtn.on('pointerover', () => okBtn.setFillStyle(0x2ecc71));
        okBtn.on('pointerout', () => okBtn.setFillStyle(0x27ae60));
    }
}