// Wizard.js
// Define las animaciones del mago y un factory para crear el sprite.
// Las hojas de sprites están en assets/wizard/ y cada frame es 128x128.
//
// Convención de nombres de animación:
//   wiz_idle, wiz_walk, wiz_run, wiz_jump, wiz_hurt, wiz_dead,
//   wiz_attack1, wiz_attack2, wiz_charge1, wiz_charge2,
//   wiz_arrow, wiz_sphere
//
// WizardAnimations.createAll(scene)  -> registra todas las animaciones (llamar 1 vez)
// WizardFactory.create(scene, x, y)  -> crea el sprite físico con anim idle por defecto

import Phaser from 'phaser';

const WIZARD_FRAMES = {
  idle:    { key: 'wiz-idle',    end: 7  },   // 8 frames: 0..7
  walk:    { key: 'wiz-walk',    end: 6  },   // 7 frames: 0..6
  run:     { key: 'wiz-run',     end: 7  },   // 8 frames: 0..7
  jump:    { key: 'wiz-jump',    end: 7  },   // 8 frames: 0..7
  hurt:    { key: 'wiz-hurt',    end: 3  },   // 4 frames: 0..3
  dead:    { key: 'wiz-dead',    end: 3  },   // 4 frames: 0..3
  attack1: { key: 'wiz-attack1', end: 6  },   // 7 frames: 0..6
  attack2: { key: 'wiz-attack2', end: 8  },   // 9 frames: 0..8
  charge1: { key: 'wiz-charge1', end: 4  },   // 5 frames: 0..4  (576 / 128 = 4.5 → 5 reales)
  charge2: { key: 'wiz-charge2', end: 2  },   // 3 frames: 0..2
  arrow:   { key: 'wiz-arrow',   end: 5  },   // 6 frames: 0..5
  sphere:  { key: 'wiz-sphere',  end: 15 },   // 16 frames: 0..15
};

export class WizardAnimations {
  static createAll(scene) {
    Object.entries(WIZARD_FRAMES).forEach(([name, cfg]) => {
      const animKey = 'wiz_' + name;
      if (scene.anims.exists(animKey)) return;

      const isLoop = !['attack1', 'attack2', 'charge1', 'charge2', 'dead', 'hurt', 'jump', 'sphere', 'arrow'].includes(name);
      const frameRate = name === 'run' || name === 'attack1' || name === 'attack2' || name === 'sphere'
        ? 16
        : 10;

      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(cfg.key, { start: 0, end: cfg.end }),
        frameRate,
        repeat: isLoop ? -1 : 0,
      });
    });
  }
}

export class WizardFactory {
  static create(scene, x, y) {
    const w = scene.physics.add.sprite(x, y, 'wiz-idle');
    w.setCollideWorldBounds(true);
    w.setOrigin(0.5, 1);                // pies en la base
    w.setSize(48, 96);                  // hitbox razonable
    w.setOffset(40, 32);                // centrado en el cuerpo
    w.setScale(1.5);                    // visualmente más grande en el juego
    w.play('wiz_idle');
    return w;
  }
}
