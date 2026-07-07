// BootScene.js
// Carga assets y pasa al menú.

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
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

    // Generamos un placeholder simple para el tesoro (mientras no lo reemplaces).
    const treasureGfx = this.make.graphics({ x: 0, y: 0, add: false });
    treasureGfx.fillStyle(0xfbbf24, 1);
    treasureGfx.fillCircle(12, 12, 12);
    treasureGfx.fillStyle(0xf59e0b, 1);
    treasureGfx.fillRect(8, 4, 8, 4);
    treasureGfx.generateTexture('treasure', 24, 24);

    const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
    groundGfx.fillStyle(0x3b3b5b, 1);
    groundGfx.fillRect(0, 0, 800, 64);
    groundGfx.generateTexture('ground', 800, 64);
  }

  create() {
    WizardAnimations.createAll(this);
    this.scene.start('MenuScene');
  }
}
