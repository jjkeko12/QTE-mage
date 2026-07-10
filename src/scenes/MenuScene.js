// MenuScene.js
// Menú principal con título y botón de inicio.

import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Capa 1: imagen nítida cubriendo toda la pantalla (depth -2)
    const sharp = this.add.image(cx, cy, 'menu-back').setOrigin(0.5).setDepth(-2);
    const w = sharp.width || 1;
    const h = sharp.height || 1;
    sharp.setScale(Math.max(this.scale.width / w, this.scale.height / h));

    // Capa 2: imagen blureada cubriendo toda la pantalla (depth -1)
    // Enmascarada con gradiente diagonal: blur a la izquierda, nítido a la derecha
    const blurred = this.add.image(cx, cy, 'menu-back-blur').setOrigin(0.5).setDepth(-1);
    blurred.setScale(Math.max(this.scale.width / w, this.scale.height / h));

    // BitmapMask con gradiente diagonal (vertical con inclinación media-baja)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 800;
    maskCanvas.height = 600;
    const mctx = maskCanvas.getContext('2d');
    const grad = mctx.createLinearGradient(0, 0, 300, 600);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,1)');
    grad.addColorStop(0.65, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    mctx.fillStyle = grad;
    mctx.fillRect(0, 0, 800, 600);

    const maskKey = 'menu-blur-mask';
    this.textures.addCanvas(maskKey, maskCanvas);
    const maskImage = this.add.image(0, 0, maskKey).setOrigin(0).setVisible(false).setDepth(-100);
    blurred.setMask(maskImage.createBitmapMask());

    // Título
    const title = this.add.text(20, 200, 'QTEs & Treasure', {
      fontFamily: 'rogenz',
      fontSize: '40px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(10);
    this.makeCutPanel(200, title.width, title.height);

    // Descripción
    const desc = this.add.text(20, 250, 'Sobrevive a los QTE y junta el tesoro', {
      fontFamily: 'rogenz',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(10);
    this.makeCutPanel(250, desc.width, desc.height);

    // Botón JUGAR
    const startBtn = this.add.text(0, 330, '[ JUGAR ]', {
      fontFamily: 'rogenz',
      fontSize: '28px',
      color: '#4ade80',
      padding: { x: 24, y: 12 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    this.makeCutPanel(330, startBtn.width, startBtn.height);

    startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffffff' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ color: '#4ade80' }));
    startBtn.on('pointerdown', () => this.scene.start('GameScene'));
  }

  makeCutPanel(y, textWidth, textHeight) {
    const padX = 40;
    const padY = 12;
    const pw = textWidth + padX;
    const ph = textHeight + padY;
    const cut = Math.min(15, ph * 0.4);
    const topExtra = ph - cut;  // extensión de la diagonal hacia la derecha arriba
    const g = this.add.graphics();
    g.fillStyle(0x1e3a5f, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(pw + topExtra, 0);   // borde superior extendido
    g.lineTo(pw, ph - cut);        // diagonal extendida (punto original sin mover)
    g.lineTo(pw - cut, ph);       // corte original (sin mover)
    g.lineTo(0, ph);
    g.closePath();
    g.fillPath();
    g.x = 0;
    g.y = y - ph / 2;
    g.setDepth(5);
    return g;
  }
}
