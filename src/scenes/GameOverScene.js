// GameOverScene.js
// Pantalla final con puntaje y botón de reinicio.

import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
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

    // Overlay de fade-in (entra negro y se desvanece)
    this.fadeOverlay = this.add.rectangle(0, 0, 800, 600, 0x000000)
      .setOrigin(0)
      .setAlpha(1)
      .setDepth(2000);
    this.tweens.add({
      targets: this.fadeOverlay,
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: 'Sine.inOut',
    });

    // Imagen de fondo del menú con tinte rojo medio oscuro y fade-in gradual
    const bg = this.add.image(cx, cy, 'menu-back')
      .setOrigin(0.5)
      .setTint(0xcc5555)
      .setAlpha(0)
      .setDepth(-1);
    const bw = bg.width || 1;
    const bh = bg.height || 1;
    bg.setScale(Math.max(this.scale.width / bw, this.scale.height / bh));

    this.add.rectangle(0, 0, 800, 600, 0x0f0f1a).setOrigin(0).setAlpha(0.4).setDepth(0);

    this.tweens.add({
      targets: bg,
      alpha: { from: 0, to: 0.8 },
      duration: 2000,
      ease: 'Sine.inOut',
    });

    this.add.text(cx, cy - 120, this.victory ? '¡VICTORIA!' : 'GAME OVER', {
      fontFamily: 'rogenz',
      fontSize: '48px',
      color: this.victory ? '#4ade80' : '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    this.add.text(cx, cy - 30, 'Tesoro acumulado: ' + this.finalScore, {
      fontFamily: 'rogenz',
      fontSize: '24px',
      color: '#fbbf24',
    }).setOrigin(0.5).setDepth(1);

    const retry = this.add.text(cx, cy + 50, '[ REINTENTAR ]', {
      fontFamily: 'rogenz',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    retry.on('pointerover', () => retry.setStyle({ color: '#4ade80' }));
    retry.on('pointerout', () => retry.setStyle({ color: '#ffffff' }));
    retry.on('pointerdown', () => this.transitionTo('GameScene'));

    const menu = this.add.text(cx, cy + 110, '[ MENÚ ]', {
      fontFamily: 'rogenz',
      fontSize: '20px',
      color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

    menu.on('pointerdown', () => this.transitionTo('MenuScene'));
  }

  transitionTo(sceneName) {
    this.input.enabled = false;
    this.tweens.add({
      targets: this.fadeOverlay,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Sine.inOut',
      onComplete: () => this.scene.start(sceneName),
    });
  }
}
