// BootScene.js
// Carga assets y pasa al menú.

import Phaser from 'phaser';
import { WizardAnimations } from '../Wizard.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.error('Error cargando asset:', file.key, file.url);
    });
    // Sprite sheets del mago (cada frame es 128x128).
    // Cargamos cada sheet como una "textura multi-frame" usando frameWidth/frameHeight
    // para poder extraer los frames por índice en las animaciones.
    this.load.spritesheet('wiz-idle',   'assets/wizard/Idle.png',   { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-walk',   'assets/wizard/Walk.png',   { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-run',    'assets/wizard/Run.png',    { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-jump',   'assets/wizard/Jump.png',   { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-hurt',   'assets/wizard/Hurt.png',   { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-dead',   'assets/wizard/Dead.png',   { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-attack1','assets/wizard/Attack_1.png',{ frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-attack2','assets/wizard/Attack_2.png',{ frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-charge1','assets/wizard/Charge_1.png',{ frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-charge2','assets/wizard/Charge_2.png',{ frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-arrow',  'assets/wizard/Magic_arrow.png',  { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('wiz-sphere', 'assets/wizard/Magic_sphere.png', { frameWidth: 128, frameHeight: 128 });

    // Fondos del mapa: los 4 backgrounds individuales (576x324 cada uno).
    // Se colocan consecutivamente en GameScene en el orden 4,1,3,2.
    this.load.image('bg-1', 'assets/images/fondo ;(/PNG/background 1/background 1.png');
    this.load.image('bg-2', 'assets/images/fondo ;(/PNG/background 2/background 2.png');
    this.load.image('bg-3', 'assets/images/fondo ;(/PNG/background 3/background 3.png');
    this.load.image('bg-4', 'assets/images/fondo ;(/PNG/background 4/background 4.png');

    // Memes / recompensas del QTE especial.
    this.load.image('family-pride', 'assets/images/es_el_orgullo_de_la_familia.png');
    this.load.image('failure-meme', 'assets/images/quien-es-este-fracasado.png');
    this.load.image('sonda-civic', 'assets/images/sonda-civic.png');
    this.load.image('aint-peak', 'assets/images/ts_aint_peak_gng.png');
    this.load.image('menu-back', 'assets/images/menu_back.png');
    this.load.image('gold-chest', 'assets/images/gold-removebg-preview.png');

    const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
    groundGfx.fillStyle(0x3b3b5b, 1);
    groundGfx.fillRect(0, 0, 800, 64);
    groundGfx.generateTexture('ground', 800, 64);

    // Placeholder para el ícono de alerta del QTE.
    const alertGfx = this.make.graphics({ x: 0, y: 0, add: false });
    alertGfx.fillStyle(0xef4444, 1);
    alertGfx.fillTriangle(16, 0, 0, 28, 32, 28);
    alertGfx.fillStyle(0xffffff, 1);
    alertGfx.fillRect(15, 8, 2, 12);
    alertGfx.fillRect(15, 22, 2, 3);
    alertGfx.generateTexture('alert', 32, 32);

    // Placeholder para la flecha indicadora de cofre (triángulo apuntando hacia abajo).
    const arrowGfx = this.make.graphics({ x: 0, y: 0, add: false });
    arrowGfx.fillStyle(0xfbbf24, 1);
    arrowGfx.fillTriangle(16, 0, 0, 20, 32, 20);
    arrowGfx.fillStyle(0xf59e0b, 1);
    arrowGfx.fillRect(14, 20, 4, 4);
    arrowGfx.generateTexture('chest-arrow', 32, 24);
  }

  create() {
    WizardAnimations.createAll(this);

    // Option A: pre-renderizar menu-back con blur en un canvas offline.
    // ctx.filter = 'blur(8px)' es compatible con Canvas2D y no depende de WebGL.
    if (this.textures.exists('menu-back')) {
      try {
        const source = this.textures.get('menu-back').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        ctx.filter = 'blur(8px)';
        ctx.drawImage(source, 0, 0);
        this.textures.addCanvas('menu-back-blur', canvas);
      } catch (e) {
        console.error('No se pudo pre-renderizar el blur del menú:', e);
      }
    }

    this.scene.start('MenuScene');
  }
}
