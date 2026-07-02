import Phaser from 'phaser';

export class ErrorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ErrorScene' });
    }

    init(data) {
        this.errorMessage = data.message || "An unknown error occurred.";
        
        // Scan the Scene Manager to find the actively running scene
        const allScenes = this.scene.manager.getScenes(false);
        const activeScene = allScenes.find(s => 
            s.scene.key !== 'ErrorScene' && 
            this.scene.manager.isActive(s.scene.key)
        );
        
        // Auto-pause the active game scene so nothing happens in the background
        if (activeScene) {
            this.parentSceneKey = activeScene.scene.key;
            this.scene.manager.pause(this.parentSceneKey);
        } else {
            this.parentSceneKey = null;
        }
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        // Dark dimming overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

        // Brown wood-ish popup panel
        const popup = this.add.rectangle(centerX, centerY, 450, 300, 0x5c4033)
            .setStrokeStyle(6, 0x3d2817); 

        // "Oops!" Heading
        this.add.text(centerX, centerY - 90, 'Oops!', {
            fontFamily: 'Georgia, serif',
            fontSize: '42px',
            color: '#ffcc00', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Dynamic error message
        this.add.text(centerX, centerY, this.errorMessage, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 380, useAdvancedWrap: true }
        }).setOrigin(0.5);

        // "Okay" Button 
        const btnBg = this.add.rectangle(centerX, centerY + 90, 140, 50, 0x27ae60)
            .setStrokeStyle(3, 0x1a0f0a)
            .setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(centerX, centerY + 90, 'Okay', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Hover Effects
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x2ecc71));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x27ae60));

        // Close logic: Stop this scene and resume the parent
        btnBg.on('pointerdown', () => {
            if (this.parentSceneKey) {
                this.scene.stop();
                this.scene.manager.resume(this.parentSceneKey);
            } else {
                this.scene.stop();
            }
        });
    }
}