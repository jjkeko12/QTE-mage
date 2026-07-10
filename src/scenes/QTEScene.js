// QTEScene.js
// Quick Time Event: el jugador debe pulsar la tecla correcta antes
// de que se acabe el tiempo. Se ejecuta como escena superpuesta.
//
// Modo normal: una sola tecla, 1500ms.
// Modo especial (cada 4 QTEs): secuencia de 4 teclas "lejanas" entre sí,
// temporizador global. Fallar una tecla falla todo el QTE.

import Phaser from 'phaser';

const QTE_KEYS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const QTE_DURATION = 800; // ms
const SPECIAL_DURATION = 2500; // ms (global para toda la secuencia)
const SPECIAL_LENGTH = 4;
const MIN_KEY_DISTANCE = 4; // distancia mínima en home-row entre teclas consecutivas

// Posiciones físicas aproximadas en el teclado QWERTY.
// Cuanto mayor la distancia, más lejos están las teclas en el teclado.
const KEY_POSITIONS = {
  Q: 0, W: 1, E: 2, R: 3, T: 4, Y: 5, U: 6, I: 7, O: 8, P: 9,
  A: 10, S: 11, D: 12, F: 13, G: 14, H: 15, J: 16, K: 17, L: 18,
  Z: 19, X: 20, C: 21, V: 22, B: 23, N: 24, M: 25,
};

export default class QTEScene extends Phaser.Scene {
  constructor() {
    super('QTEScene');
  }

  create(data) {
    this.success = false;
    this.finished = false;
    this.special = !!(data && data.special);
    // Reset de propiedades stale: la escena es un singleton y las
    // referencias JS persisten aunque scene.stop() destruya los objetos.
    this.keyText = null;
    this.keyBox = null;
    this.keyGlowLeft = null;
    this.keyGlowRight = null;
    this.seqTexts = null;
    this.seqBoxes = null;
    this.currentGlowLeft = null;
    this.currentGlowRight = null;
    this.targetKey = null;
    this.resultText = null;
    this.timerBarLeft = null;
    this.timerBarRight = null;
    this.timerBarCenter = null;
    this.timerBarEndLeft = null;
    this.timerBarEndRight = null;
    this.normalKeyHandler = null;
    this.specialKeyHandler = null;
    this.failIndex = -1;
    this.timedOut = false;

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Fondo semitransparente
    this.add.rectangle(0, 0, 800, 600, 0x000000, 0.6).setOrigin(0);

    // Alerta visual
    this.add.image(cx, cy - 140, 'alert').setScale(2);

    if (this.special) {
      this.createSpecial(cx, cy);
    } else {
      this.createNormal(cx, cy);
    }
  }

  // ---------- Modo normal ----------
  createNormal(cx, cy) {
    // Tecla objetivo
    this.targetKey = Phaser.Utils.Array.GetRandom(QTE_KEYS);
    this.add.text(cx, cy - 60, '¡PULSA RÁPIDO!', { fontFamily: 'rogenz', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    // Cuadro rotado 45° detrás del texto
    this.keyBox = this.add.rectangle(cx, cy + 10, 120, 120, 0x000000)
      .setRotation(Math.PI / 4)
      .setDepth(5);
    this.keyText = this.add.text(cx, cy + 10, this.targetKey, {
      fontFamily: 'Courier New, monospace',
      fontSize: '80px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

    // Glows rojo/azul a los lados del cuadro a presionar
    this.keyGlowLeft = this.add.circle(cx - 65, cy + 10, 8, 0xef4444).setDepth(4);
    this.keyGlowLeft.postFX.addGlow(0xef4444, 16, 8);
    this.keyGlowRight = this.add.circle(cx + 65, cy + 10, 8, 0x3b82f6).setDepth(4);
    this.keyGlowRight.postFX.addGlow(0x3b82f6, 16, 8);

    this.buildTimerBar(cx, cy + 90, QTE_DURATION);

    this.timedEvent = this.time.addEvent({
      delay: QTE_DURATION,
      callback: () => this.finish(false),
    });

    this.input.keyboard.once('keydown-' + this.targetKey, () => this.finish(true));

    this.normalKeyHandler = (event) => {
      if (this.finished) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight'
          || event.code === 'ArrowUp' || event.code === 'ArrowDown'
          || event.code === 'Space') return;
      if (event.key.toUpperCase() !== this.targetKey) {
        this.input.keyboard.off('keydown', this.normalKeyHandler);
        this.input.keyboard.off('keydown-' + this.targetKey);
        this.finish(false);
      }
    };
    this.input.keyboard.on('keydown', this.normalKeyHandler);
  }

  // ---------- Modo especial ----------
  createSpecial(cx, cy) {
    this.sequence = this.generateSequence();
    this.currentIndex = 0;
    this.failIndex = -1;
    this.timedOut = false;

    this.add.text(cx, cy - 100, '¡SECUENCIA ESPECIAL!', { fontFamily: 'rogenz', fontSize: '26px', color: '#f472b6', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 50, 'Pulsa las 4 teclas en orden', { fontFamily: 'rogenz', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    // Render de cada tecla de la secuencia
    this.seqBoxes = [];
    this.seqTexts = this.sequence.map((key, i) => {
      const spacing = 135;
      const startX = cx - (spacing * (SPECIAL_LENGTH - 1)) / 2;
      const bx = startX + i * spacing;
      const by = cy + 20;
      const box = this.add.rectangle(bx, by, 110, 110, 0x000000)
        .setRotation(Math.PI / 4)
        .setDepth(5);
      this.seqBoxes.push(box);
      const txt = this.add.text(bx, by, key, {
        fontFamily: 'Courier New, monospace',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);
      return txt;
    });

    // Resalta la tecla actual
    this.highlightCurrent();

    this.buildTimerBar(cx, cy + 150, SPECIAL_DURATION);

    this.timedEvent = this.time.addEvent({
      delay: SPECIAL_DURATION,
      callback: () => { this.timedOut = true; this.finish(false); },
    });

    this.specialKeyHandler = (event) => {
      if (this.finished) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight'
          || event.code === 'ArrowUp' || event.code === 'ArrowDown'
          || event.code === 'Space') return;
      const pressed = event.key.toUpperCase();
      const expected = this.sequence[this.currentIndex];
      if (pressed === expected) {
        // Avanza a la siguiente tecla
        this.seqTexts[this.currentIndex].setStyle({ color: '#ffffff' });
        this.seqBoxes[this.currentIndex].setFillStyle(0x4ade80);
        // Destruir glows de la tecla completada
        if (this.currentGlowLeft) { this.currentGlowLeft.destroy(); this.currentGlowLeft = null; }
        if (this.currentGlowRight) { this.currentGlowRight.destroy(); this.currentGlowRight = null; }
        this.currentIndex += 1;
        if (this.currentIndex >= this.sequence.length) {
          this.input.keyboard.off('keydown', this.specialKeyHandler);
          this.finish(true);
        } else {
          this.highlightCurrent();
        }
      } else {
        // Cualquier tecla incorrecta falla todo el QTE
        this.failIndex = this.currentIndex;
        this.input.keyboard.off('keydown', this.specialKeyHandler);
        this.finish(false);
      }
    };
    this.input.keyboard.on('keydown', this.specialKeyHandler);
  }

  // Genera una secuencia de 4 teclas donde cada tecla está "lejos" de la anterior
  // (distancia mínima en la fila base del teclado).
  generateSequence() {
    const seq = [];
    let prev = null;
    let attempts = 0;
    while (seq.length < SPECIAL_LENGTH && attempts < 200) {
      attempts += 1;
      const candidate = Phaser.Utils.Array.GetRandom(QTE_KEYS);
      if (candidate === prev) continue;
      if (prev !== null) {
        const dist = Math.abs(KEY_POSITIONS[candidate] - KEY_POSITIONS[prev]);
        if (dist < MIN_KEY_DISTANCE) continue;
      }
      seq.push(candidate);
      prev = candidate;
    }
    // Si no se pudo generar con restricciones (muy improbable), rellena.
    while (seq.length < SPECIAL_LENGTH) {
      const k = Phaser.Utils.Array.GetRandom(QTE_KEYS);
      if (seq.length === 0 || k !== seq[seq.length - 1]) seq.push(k);
    }
    return seq;
  }

  highlightCurrent() {
    const txt = this.seqTexts[this.currentIndex];
    const box = this.seqBoxes[this.currentIndex];
    txt.setStyle({ color: '#ffffff' });
    box.setFillStyle(0x000000);
    // Destruir glows anteriores si existen
    if (this.currentGlowLeft) this.currentGlowLeft.destroy();
    if (this.currentGlowRight) this.currentGlowRight.destroy();
    // Crear glows rojo/azul a los lados de la tecla activa
    this.currentGlowLeft = this.add.circle(box.x - 65, box.y, 8, 0xef4444).setDepth(4);
    this.currentGlowLeft.postFX.addGlow(0xef4444, 16, 8);
    this.currentGlowRight = this.add.circle(box.x + 65, box.y, 8, 0x3b82f6).setDepth(4);
    this.currentGlowRight.postFX.addGlow(0x3b82f6, 16, 8);
    // Pulso para llamar la atención
    this.tweens.add({
      targets: txt,
      scale: 1.15,
      duration: 250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // ---------- Compartido ----------
  buildTimerBar(cx, cy, duration) {
    this.timerBarLeft = this.add.rectangle(cx, cy, 200, 8, 0xef4444).setOrigin(1, 0.5);
    this.timerBarRight = this.add.rectangle(cx, cy, 200, 8, 0x3b82f6).setOrigin(0, 0.5);
    this.timerBarLeft.postFX.addGlow(0xef4444, 24, 12);
    this.timerBarRight.postFX.addGlow(0x3b82f6, 24, 12);
    // Brillo central donde se conectan las barras (máximo)
    this.timerBarCenter = this.add.circle(cx, cy, 8, 0xffffff).setDepth(6);
    this.timerBarCenter.postFX.addGlow(0xffffff, 32, 16);
    // Brillo en los extremos de las barras (blancos, siguen la barra)
    this.timerBarEndLeft = this.add.circle(cx - 200, cy, 4, 0xffffff).setDepth(6);
    this.timerBarEndLeft.postFX.addGlow(0xffffff, 32, 16);
    this.timerBarEndRight = this.add.circle(cx + 200, cy, 4, 0xffffff).setDepth(6);
    this.timerBarEndRight.postFX.addGlow(0xffffff, 32, 16);
    this.tweens.add({
      targets: this.timerBarLeft,
      scaleX: 0,
      duration,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: this.timerBarRight,
      scaleX: 0,
      duration,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: this.timerBarEndLeft,
      x: cx,
      duration,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: this.timerBarEndRight,
      x: cx,
      duration,
      ease: 'Linear',
    });
  }

  finish(success) {
    if (this.finished) return;
    this.finished = true;
    this.success = success;

    if (this.timedEvent) this.timedEvent.remove();
    // Limpieza robusta de listeners de teclado para que no interfieran
    // con el siguiente QTE (normal o especial).
    if (this.normalKeyHandler) this.input.keyboard.off('keydown', this.normalKeyHandler);
    if (this.specialKeyHandler) this.input.keyboard.off('keydown', this.specialKeyHandler);
    if (this.targetKey) this.input.keyboard.off('keydown-' + this.targetKey);
    this.input.keyboard.removeAllListeners('keydown');

    // Destruir glows rojo/azul
    if (this.keyGlowLeft) { this.keyGlowLeft.destroy(); this.keyGlowLeft = null; }
    if (this.keyGlowRight) { this.keyGlowRight.destroy(); this.keyGlowRight = null; }
    if (this.currentGlowLeft) { this.currentGlowLeft.destroy(); this.currentGlowLeft = null; }
    if (this.currentGlowRight) { this.currentGlowRight.destroy(); this.currentGlowRight = null; }

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Determinar el delay según modo y resultado
    let delay;
    if (this.special) {
      delay = 500;  // solo el texto de resultado, la imagen va en GameScene
    } else {
      delay = this.success ? 200 : 500;
    }

    // Programar el cierre de la escena ANTES de tocar la imagen: así,
    // aunque la imagen falle, la escena siempre se cierra y el juego
    // se reanuda (evita el congelamiento tras el QTE especial).
    this.time.delayedCall(delay, () => {
      this.events.emit('qte-finished', {
        success: this.success,
        special: this.special,
        failIndex: this.failIndex,
        timedOut: this.timedOut,
      });
      this.scene.stop();
    });

    if (this.keyText) {
      this.keyText.setText(success ? '¡BIEN!' : '¡FALLASTE!');
      this.keyText.setStyle({ color: '#ffffff' });
      if (this.keyBox) this.keyBox.setFillStyle(success ? 0x4ade80 : 0xef4444);
    } else if (this.seqTexts) {
      // En modo especial mostramos el resultado sobre la secuencia
      this.resultText = this.add.text(cx, cy + 130, success ? '¡BIEN!' : '¡FALLASTE!', {
        fontFamily: 'rogenz',
        fontSize: '40px',
        color: success ? '#4ade80' : '#ef4444',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }
    const color = success ? 0x4ade80 : 0xef4444;
    if (this.timerBarLeft) this.timerBarLeft.setFillStyle(color);
    if (this.timerBarRight) this.timerBarRight.setFillStyle(color);
  }
}