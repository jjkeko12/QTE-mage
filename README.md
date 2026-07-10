# The lost mage

Prototipo de juego en **Phaser 3** (HTML/JS puro, sin build) donde el jugador recolecta tesoros y debe sobrevivir a **Quick Time Events** aleatorios.

## Cómo jugar

1. Abre `index.html` en un navegador moderno (o sirve la carpeta con un servidor estático local, ej. `python -m http.server 8000`).
2. Pulsa **JUGAR** en el menú.
3. Mueve al personaje con `←` `→` y salta con `↑`.
4. Toca los **tesoros** para sumar puntos.
5. Cuando aparezca un QTE, pulsa la **tecla mostrada** (A, S, D, F, J, K o L) antes de que se acabe la barra de tiempo.
6. Tienes **3 vidas**. Si las pierdes, game over.

## Estructura

```
proyecto j/
├── index.html                # Entrada + carga Phaser desde CDN
├── src/
│   ├── main.js               # Configuración de Phaser y registro de escenas
│   └── scenes/
│       ├── BootScene.js      # Carga/genera assets y va al menú
│       ├── MenuScene.js      # Menú principal
│       ├── GameScene.js      # Loop principal (movimiento, tesoros, QTEs)
│       ├── QTEScene.js       # Escena superpuesta de Quick Time Event
│       └── GameOverScene.js  # Pantalla final con puntaje
└── assets/                   # Carpeta para futuros sprites/sfx
    ├── images/
    └── audio/
```

## Ideas para extender

- Reemplazar los assets placeholder en `BootScene.js` con sprites reales.
- Añadir distintos tipos de QTE (secuencia de teclas, barra de timing, click rápido).
- Sistema de niveles con dificultad creciente (más QTE, menos tiempo).
- Guardar `highscore` en `localStorage`.
- Efectos de sonido al recolectar / fallar.
