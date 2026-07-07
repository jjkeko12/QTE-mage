// GameOverScene.js
// Pantalla final con puntaje y botón de reinicio.

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score ?? 0;
    this.victory = !!data.victory;
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.rectangle(0, 0, 800, 600, 0x0f0f1a).setOrigin(0);

    this.add.text(cx, cy - 120, this.victory ? '¡VICTORIA!' : 'GAME OVER', {
      fontSize: '48px',
      color: this.victory ? '#4ade80' : '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, 'Tesoro acumulado: ' + this.finalScore, {
      fontSize: '24px',
      color: '#fbbf24',
    }).setOrigin(0.5);

    const retry = this.add.text(cx, cy + 50, '[ REINTENTAR ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerover', () => retry.setStyle({ color: '#4ade80' }));
    retry.on('pointerout', () => retry.setStyle({ color: '#ffffff' }));
    retry.on('pointerdown', () => this.scene.start('GameScene'));

    const menu = this.add.text(cx, cy + 110, '[ MENÚ ]', {
      fontSize: '20px',
      color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menu.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
