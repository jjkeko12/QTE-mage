// MenuScene.js
// Menú principal con título y botón de inicio.

class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 120, 'QTEs & Treasure', {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 60, 'Sobrevive a los QTE y junta el tesoro', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, cy + 30, '[ JUGAR ]', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#4ade80',
      backgroundColor: '#1f2937',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffffff' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ color: '#4ade80' }));
    startBtn.on('pointerdown', () => this.scene.start('GameScene'));

    const previewBtn = this.add.text(cx, cy + 100, '[ PREVIEW MAGO ]', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    previewBtn.on('pointerover', () => previewBtn.setStyle({ color: '#fbbf24' }));
    previewBtn.on('pointerout', () => previewBtn.setStyle({ color: '#9ca3af' }));
    previewBtn.on('pointerdown', () => this.scene.start('WizardPreviewScene'));
  }
}
