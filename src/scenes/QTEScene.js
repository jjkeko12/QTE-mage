// QTEScene.js
// Quick Time Event: el jugador debe pulsar la tecla correcta antes
// de que se acabe el tiempo. Se ejecuta como escena superpuesta.

const QTE_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
const QTE_DURATION = 1500; // ms

class QTEScene extends Phaser.Scene {
  constructor() {
    super('QTEScene');
  }

  create(data) {
    this.success = false;
    this.finished = false;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Fondo semitransparente
    this.add.rectangle(0, 0, 800, 600, 0x000000, 0.6).setOrigin(0);

    // Alerta visual
    this.add.image(cx, cy - 120, 'alert').setScale(2);

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

    // Barra de tiempo
    this.timerBar = this.add.rectangle(cx, cy + 100, 400, 14, 0x4ade80).setOrigin(0.5);

    this.timedEvent = this.time.addEvent({
      delay: QTE_DURATION,
      callback: () => this.finish(false),
    });

    // Tween de la barra
    this.tweens.add({
      targets: this.timerBar,
      scaleX: 0,
      duration: QTE_DURATION,
      ease: 'Linear',
      onUpdate: () => {
        this.timerBar.x = cx - (400 * (1 - this.tweens.getTweensOf(this.timerBar)[0].progress)) / 2;
      },
    });

    this.input.keyboard.once('keydown-' + this.targetKey, () => this.finish(true));
  }

  finish(success) {
    if (this.finished) return;
    this.finished = true;
    this.success = success;

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.keyText.setText(success ? '¡BIEN!' : '¡FALLASTE!');
    this.keyText.setStyle({ color: success ? '#4ade80' : '#ef4444' });
    this.timerBar.setFillStyle(success ? 0x4ade80 : 0xef4444);

    this.time.delayedCall(600, () => {
      this.events.emit('qte-finished', { success: this.success });
      this.scene.stop();
    });
  }
}
