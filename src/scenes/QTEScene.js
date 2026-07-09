// QTEScene.js
// Quick Time Event: el jugador debe pulsar la tecla correcta antes
// de que se acabe el tiempo. Se ejecuta como escena superpuesta.
//
// Modo normal: una sola tecla, 1500ms.
// Modo especial (cada 4 QTEs): secuencia de 4 teclas "lejanas" entre sí,
// temporizador global. Fallar una tecla falla todo el QTE.

import Phaser from 'phaser';

const QTE_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
const QTE_DURATION = 800; // ms
const SPECIAL_DURATION = 2500; // ms (global para toda la secuencia)
const SPECIAL_LENGTH = 4;
const MIN_KEY_DISTANCE = 4; // distancia mínima en home-row entre teclas consecutivas

// Posiciones físicas aproximadas en la fila base (QWERTY).
// Cuanto mayor la distancia, más lejos están las teclas en el teclado.
const KEY_POSITIONS = { A: 0, S: 1, D: 2, F: 3, J: 6, K: 7, L: 8 };

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
    this.seqTexts = null;
    this.targetKey = null;
    this.resultText = null;
    this.timerBarLeft = null;
    this.timerBarRight = null;
    this.normalKeyHandler = null;
    this.specialKeyHandler = null;
    this.failIndex = -1;
    this.timedOut = false;

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Fondo semitransparente
    this.add.rectangle(0, 0, 800, 600, 0x000000, 0.6).setOrigin(0);

    // Alerta visual
    this.add.image(cx, cy - 120, 'alert').setScale(2);

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
    this.add.text(cx, cy - 40, '¡PULSA RÁPIDO!', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.keyText = this.add.text(cx, cy + 20, this.targetKey, {
      fontSize: '64px',
      color: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#111827',
      padding: { x: 30, y: 18 },
    }).setOrigin(0.5);

    this.buildTimerBar(cx, cy + 80, QTE_DURATION);

    this.timedEvent = this.time.addEvent({
      delay: QTE_DURATION,
      callback: () => this.finish(false),
    });

    this.input.keyboard.once('keydown-' + this.targetKey, () => this.finish(true));

    this.normalKeyHandler = (event) => {
      if (this.finished) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight'
          || event.code === 'ArrowUp' || event.code === 'ArrowDown') return;
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

    this.add.text(cx, cy - 80, '¡SECUENCIA ESPECIAL!', { fontSize: '26px', color: '#f472b6', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 40, 'Pulsa las 4 teclas en orden', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    // Render de cada tecla de la secuencia
    this.seqTexts = this.sequence.map((key, i) => {
      const spacing = 110;
      const startX = cx - (spacing * (SPECIAL_LENGTH - 1)) / 2;
      const txt = this.add.text(startX + i * spacing, cy + 30, key, {
        fontSize: '48px',
        color: '#fbbf24',
        fontStyle: 'bold',
        backgroundColor: '#111827',
        padding: { x: 22, y: 14 },
      }).setOrigin(0.5);
      return txt;
    });

    // Resalta la tecla actual
    this.highlightCurrent();

    this.buildTimerBar(cx, cy + 130, SPECIAL_DURATION);

    this.timedEvent = this.time.addEvent({
      delay: SPECIAL_DURATION,
      callback: () => { this.timedOut = true; this.finish(false); },
    });

    this.specialKeyHandler = (event) => {
      if (this.finished) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight'
          || event.code === 'ArrowUp' || event.code === 'ArrowDown') return;
      const pressed = event.key.toUpperCase();
      const expected = this.sequence[this.currentIndex];
      if (pressed === expected) {
        // Avanza a la siguiente tecla
        this.seqTexts[this.currentIndex].setStyle({ color: '#4ade80' });
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
    txt.setStyle({ color: '#ffffff', backgroundColor: '#7c2d12' });
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
    this.timerBarLeft = this.add.rectangle(cx, cy, 200, 14, 0x4ade80).setOrigin(1, 0.5);
    this.timerBarRight = this.add.rectangle(cx, cy, 200, 14, 0x4ade80).setOrigin(0, 0.5);
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
      this.keyText.setStyle({ color: success ? '#4ade80' : '#ef4444' });
    } else if (this.seqTexts) {
      // En modo especial mostramos el resultado sobre la secuencia
      this.resultText = this.add.text(cx, cy + 110, success ? '¡BIEN!' : '¡FALLASTE!', {
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