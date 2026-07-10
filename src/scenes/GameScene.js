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
    this.maxLives = 4;
    this.gameOver = false;
    this.qteActive = false;
    this.qteCount = 0;

    // Fade-in al entrar al juego
    const fadeOverlay = this.add.rectangle(0, 0, 800, 600, 0x000000)
      .setOrigin(0)
      .setAlpha(1)
      .setDepth(1000);
    this.tweens.add({
      targets: fadeOverlay,
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: 'Sine.inOut',
    });

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
    this.groundTop = Math.round(309 * bgScale); // ~572
    const groundTop = this.groundTop;
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

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // HUD
    this.scoreText = this.add.text(16, 16, 'Tesoro: 0', { fontFamily: 'rogenz', fontSize: '20px', color: '#fbbf24' }).setScrollFactor(0);
    this.livesText = this.add.text(16, 44, 'Vidas: ❤❤❤', { fontFamily: 'rogenz', fontSize: '18px', color: '#ef4444' }).setScrollFactor(0);
    this.helpText = this.add.text(16, 72, '← → moverse, ↑ saltar, Z atacar', { fontFamily: 'rogenz', fontSize: '14px', color: '#9ca3af' }).setScrollFactor(0);

    this.chests = this.physics.add.group();
    this.physics.add.overlap(this.player, this.chests, (_p, chest) => {
      chest.destroy();
      const roll = Math.random();
      if (roll < 0.5) {
        this.score += 10;
      } else if (roll < 0.8) {
        this.score += 20;
      } else {
        this.score += 25;
        if (this.lives < this.maxLives) {
          this.lives += 1;
          this.updateLivesHUD();
        }
      }
      this.scoreText.setText('Tesoro: ' + this.score);
      this.activeChest = null;
      this.chestArrow.setVisible(false);
      this.scheduleChest();
    });

    this.chestArrow = this.add.image(400, 50, 'chest-arrow')
      .setScrollFactor(0)
      .setDepth(500)
      .setVisible(false);
    this.activeChest = null;
    this.chestArrowBob = 0;

    this.scheduleQTE();
    this.scheduleChest();
  }

  update() {
    if (this.gameOver || this.qteActive) return;

    const speed = 300;

    this.updateChestArrow();
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

  scheduleChest() {
    const delay = Phaser.Math.Between(3000, 7000);
    this.time.addEvent({
      delay,
      callback: () => {
        if (!this.gameOver) this.spawnChest();
      },
    });
  }

  spawnChest() {
    let x;
    const playerX = this.player.x;
    if (Math.random() < 0.5) {
      x = playerX + Phaser.Math.Between(500, 1000);
      if (x > this.MAP_WIDTH - 40) x = playerX - Phaser.Math.Between(500, 1000);
    } else {
      x = playerX - Phaser.Math.Between(500, 1000);
      if (x < 40) x = playerX + Phaser.Math.Between(500, 1000);
    }
    x = Phaser.Math.Clamp(x, 40, this.MAP_WIDTH - 40);
    const chest = this.chests.create(x, this.groundTop - 24, 'gold-chest');
    const targetH = 48;
    const origH = chest.frame.height || 1;
    const scale = targetH / origH;
    chest.setScale(scale);
    chest.setOrigin(0.5, 1);
    if (chest.body) {
      chest.body.setSize(chest.frame.width * scale, chest.frame.height * scale);
      chest.body.setOffset((chest.frame.width - chest.frame.width * scale) / 2, chest.frame.height - chest.frame.height * scale);
    }
    chest.setBounce(0);
    chest.setGravityY(0);
    chest.setCollideWorldBounds(true);
    this.physics.add.collider(chest, this.ground);
    this.activeChest = chest;
  }

  updateChestArrow() {
    if (!this.activeChest || !this.activeChest.active) {
      if (this.chestArrow) this.chestArrow.setVisible(false);
      return;
    }
    const cam = this.cameras.main;
    const screenChestX = this.activeChest.x - cam.scrollX;
    const screenChestY = this.activeChest.y - cam.scrollY;

    const margin = 30;
    const inView = screenChestX > 0 && screenChestX < this.scale.width
      && screenChestY > 0 && screenChestY < this.scale.height;

    if (inView) {
      this.chestArrow.setVisible(false);
      return;
    }

    // Calcular la posición clamped en el borde de la pantalla hacia el cofre
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    let ax = cx;
    let ay = cy;

    const dx = screenChestX - cx;
    const dy = screenChestY - cy;

    // Determinar en qué borde cae la recta hacia el cofre
    const halfW = this.scale.width / 2 - margin;
    const halfH = this.scale.height / 2 - margin;
    const scaleX = halfW / Math.abs(dx || 0.0001);
    const scaleY = halfH / Math.abs(dy || 0.0001);
    const scaleMin = Math.min(scaleX, scaleY);
    ax = cx + dx * scaleMin;
    ay = cy + dy * scaleMin;

    this.chestArrow.x = ax;
    this.chestArrow.y = ay;

    // Rotar la flecha para apuntar al cofre
    const angle = Math.atan2(dy, dx);
    this.chestArrow.rotation = angle + Math.PI / 2;

    this.chestArrow.setVisible(true);
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

      // Mostrar imagen de resultado del QTE especial sobre el juego
      if (data.special) {
        this.showSpecialResultImage(data.success, data.failIndex, data.timedOut);
      }

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

  showSpecialResultImage(success, failIndex, timedOut) {
    let imgKey;
    if (success) {
      imgKey = 'family-pride';        // completado
    } else if (timedOut) {
      imgKey = 'sonda-civic';         // no pulsó ninguna tecla
    } else if (failIndex < 2) {
      imgKey = 'failure-meme';        // falló 1ª o 2ª tecla
    } else {
      imgKey = 'aint-peak';           // falló 3ª o 4ª tecla
    }
    if (!this.textures.exists(imgKey)) {
      console.error('Textura no encontrada:', imgKey);
      return;
    }
    try {
      const img = this.add.image(this.scale.width / 2, this.scale.height / 2, imgKey)
        .setOrigin(0.5)
        .setScrollFactor(0)  // fija en pantalla (HUD)
        .setDepth(1000);
      const w = img.width || 1;
      const h = img.height || 1;
      img.setScale(Math.min(this.scale.width / w, this.scale.height / h));
      img.setAlpha(1);
      this.tweens.add({
        targets: img,
        alpha: { from: 1, to: 0 },
        duration: 500,
        delay: 1000,   // visible 1000 ms
        onComplete: () => img.destroy(),
      });
    } catch (e) {
      console.error('Error al mostrar imagen del QTE especial:', e);
    }
  }

  updateLivesHUD() {
    const hearts = '❤'.repeat(Math.min(this.lives, 3)) + '·'.repeat(Math.max(0, 3 - this.lives));
    if (this.lives >= 4) {
      this.livesText.setText('Vidas: ' + hearts + '💙');
    } else {
      this.livesText.setText('Vidas: ' + hearts);
    }
  }

  endGame(victory) {
    this.gameOver = true;
    this.player.play('wiz_dead', true);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, victory });
    });
  }
}
