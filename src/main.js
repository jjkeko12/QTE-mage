// main.js
// Punto de entrada: configura Phaser y registra las escenas.

import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import QTEScene from './scenes/QTEScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WizardPreviewScene from './scenes/WizardPreviewScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    QTEScene,
    GameOverScene,
    WizardPreviewScene,
  ],
};

new Phaser.Game(config);
