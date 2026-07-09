// WizardPreviewScene.js
// Escena auxiliar: muestra el mago y permite alternar entre sus
// animaciones con teclas 1..9, 0, -, =. Útil para QA visual.

import Phaser from 'phaser';

export default class WizardPreviewScene extends Phaser.Scene {
  constructor() {
    super('WizardPreviewScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.add.text(16, 16, 'Preview de animaciones del mago', { fontFamily: 'rogenz', fontSize: '20px', color: '#fbbf24' });
    this.add.text(16, 46, '1 idle · 2 walk · 3 run · 4 jump · 5 hurt · 6 dead · 7 attack1 · 8 attack2 · 9 charge1 · 0 charge2 · - arrow · = sphere · ESPACIO volver', { fontFamily: 'rogenz', fontSize: '12px', color: '#9ca3af' });

    // Suelo de referencia
    this.add.rectangle(400, 540, 800, 4, 0x4b5563).setOrigin(0.5);

    this.wizard = this.add.sprite(400, 412, 'wiz-idle');
    this.wizard.setOrigin(0.5, 1);
    this.wizard.setScale(2.5);
    this.wizard.play('wiz_idle');

    const keys = [
      { key: 'ONE',    anim: 'wiz_idle',    label: '1' },
      { key: 'TWO',    anim: 'wiz_walk',    label: '2' },
      { key: 'THREE',  anim: 'wiz_run',     label: '3' },
      { key: 'FOUR',   anim: 'wiz_jump',    label: '4' },
      { key: 'FIVE',   anim: 'wiz_hurt',    label: '5' },
      { key: 'SIX',    anim: 'wiz_dead',    label: '6' },
      { key: 'SEVEN',  anim: 'wiz_attack1', label: '7' },
      { key: 'EIGHT',  anim: 'wiz_attack2', label: '8' },
      { key: 'NINE',   anim: 'wiz_charge1', label: '9' },
      { key: 'ZERO',   anim: 'wiz_charge2', label: '0' },
      { key: 'MINUS',  anim: 'wiz_arrow',   label: '-' },
      { key: 'EQUALS', anim: 'wiz_sphere',  label: '=' },
    ];

    keys.forEach(({ key, anim, label }) => {
      this.input.keyboard.on('keydown-' + key, () => this.wizard.play(anim, true));
    });

    this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
  }
}
