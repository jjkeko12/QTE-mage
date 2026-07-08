// GameScene.js
// Escena principal: el mago se mueve, junta tesoros y enfrenta QTEs
// de forma aleatoria.

import Phaser from 'phaser';
import { WizardFactory } from '../Wizard.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.qteActive = false;
    this.qteCount = 0;

    // Dimensiones del mapa: 4 backgrounds consecutivos escalados al alto del canvas.
    // Cada background mide 576x324; escalado a 600 de alto → tileW = 576 * (600/324) ≈ 1066.67.
    // 4 tiles → ~4267px de ancho total.
    const bgScale = this.scale.height / 324;
    const tileW = 576 * bgScale;
    this.MAP_WIDTH = Math.round(tileW * 4);
    this.MAP_HEIGHT = 600;

    // Mundo físico y cámara con scroll horizontal.
    this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);

    // Fondos consecutivos en el orden 4,1,3,2 (scroll normal con la cámara).
    const order = ['bg-4', 'bg-1', 'bg-3', 'bg-2'];
    order.forEach((key, i) => {
      this.add.image(i * tileW, 0, key)
        .setOrigin(0, 0)
        .setScale(bgScale)
        .setDepth(-1);
    });

    // Suelo físico invisible alineado con la línea de suelo del fondo arenoso
    // (el background ya incluye el suelo visual). Top del suelo ≈ y 572 escalado.
    const groundTop = Math.round(309 * bgScale); // ~572
    const groundH = this.MAP_HEIGHT - groundTop;  // rellena hasta el fondo del canvas
    const groundGfx = this.make.graphics({ x: 0, y: 0, add: false });
    groundGfx.fillStyle(0x3b3b5b, 1);
    groundGfx.fillRect(0, 0, this.MAP_WIDTH, groundH);
    groundGfx.generateTexture('ground-wide', this.MAP_WIDTH, groundH);
    this.ground = this.physics.add.staticImage(this.MAP_WIDTH / 2, groundTop + groundH / 2, 'ground-wide')
      .setOrigin(0.5)
      .setDepth(0)
      .setVisible(false)
      .refreshBody();

    // Mago
    this.player = WizardFactory.create(this, 100, 400);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.ground);

    // La cámara sigue al mago horizontalmente.
    this.cameras.main.startFollow(this.player, true, 0.08, 0);

    // Grupo de tesoros
    this.treasures = this.physics.add.group();
    this.spawnTreasure();

    this.physics.add.overlap(this.player, this.treasures, (_p, t) => {
      t.destroy();
      this.score += 10;
      this.scoreText.setText('Tesoro: ' + this.score);
      this.spawnTreasure();
    });

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // HUD
    this.scoreText = this.add.text(16, 16, 'Tesoro: 0', { fontSize: '20px', color: '#fbbf24' }).setScrollFactor(0);
    this.livesText = this.add.text(16, 44, 'Vidas: ❤❤❤', { fontSize: '18px', color: '#ef4444' }).setScrollFactor(0);
    this.helpText = this.add.text(16, 72, '← → moverse, ↑ saltar, Z atacar', { fontSize: '14px', color: '#9ca3af' }).setScrollFactor(0);

    this.scheduleQTE();
  }

  update() {
    if (this.gameOver || this.qteActive) return;

    const speed = 200;
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const moving = this.cursors.left.isDown || this.cursors.right.isDown;
    const velX = this.player.body.velocity.x;

    // Movimiento
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Salto
    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-360);
    }

    // Ataque
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      this.playAttack();
    }

    // Selección de animación según estado
    if (!onGround) {
      if (this.player.anims.currentAnim?.key !== 'wiz_jump') this.player.play('wiz_jump', true);
    } else if (moving) {
      const target = Math.abs(velX) > 150 ? 'wiz_run' : 'wiz_walk';
      if (this.player.anims.currentAnim?.key !== target) this.player.play(target, true);
    } else {
      if (this.player.anims.currentAnim?.key !== 'wiz_idle') this.player.play('wiz_idle', true);
    }
  }

  playAttack() {
    const key = Math.random() < 0.5 ? 'wiz_attack1' : 'wiz_attack2';
    this.player.play(key, true);
    this.player.once('animationcomplete', () => {
      if (this.player.active) this.player.play('wiz_idle', true);
    });
  }

  spawnTreasure() {
    const x = Phaser.Math.Between(40, this.MAP_WIDTH - 40);
    const t = this.treasures.create(x, 0, 'treasure');
    t.setBounce(0.4);
    t.setCollideWorldBounds(true);
    t.setVelocity(Phaser.Math.Between(-80, 80), 0);
    this.physics.add.collider(t, this.ground);
  }

  scheduleQTE() {
    const delay = Phaser.Math.Between(3000, 7000);
    this.time.addEvent({
      delay,
      callback: () => {
        if (!this.gameOver) this.triggerQTE();
      },
    });
  }

  triggerQTE() {
    this.qteActive = true;
    this.qteCount += 1;
    const special = this.qteCount % 4 === 0;
    // Animación de "alerta" mientras está pausado
    this.player.play('wiz_hurt', true);
    this.scene.pause();
    this.scene.launch('QTEScene', { lives: this.lives, special });
    this.scene.get('QTEScene').events.once('qte-finished', (data) => {
      this.qteActive = false;
      this.scene.resume();
      if (data.success) {
        this.player.play('wiz_sphere', true);
        this.player.once('animationcomplete', () => {
          if (this.player.active) this.player.play('wiz_idle', true);
        });
      } else {
        this.lives -= 1;
        this.updateLivesHUD();
        this.player.play('wiz_hurt', true);
        this.player.once('animationcomplete', () => {
          if (this.player.active) this.player.play('wiz_idle', true);
        });
        if (this.lives <= 0) this.endGame(false);
      }
      if (!this.gameOver) this.scheduleQTE();
    });
  }

  updateLivesHUD() {
    const hearts = '❤'.repeat(this.lives) + '·'.repeat(3 - this.lives);
    this.livesText.setText('Vidas: ' + hearts);
  }

  endGame(victory) {
    this.gameOver = true;
    this.player.play('wiz_dead', true);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, victory });
    });
  }
}
