// EMBER TIDE — input: keyboard and mouse state, one object the game polls.

export class Input {
  constructor(canvas) {
    this.keys = {};
    this.mouseX = 0; this.mouseY = 0; this.mouseDown = false;
    this.pressed = {};
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    canvas.addEventListener('mousemove', (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
    canvas.addEventListener('mousedown', () => { this.mouseDown = true; });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  }

  down(code) { return !!this.keys[code]; }
  hit(code) { return !!this.pressed[code]; }
  endFrame() { this.pressed = {}; }

  axis() {
    let f = 0; let s = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) f += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) f -= 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) s -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) s += 1;
    return { f, s };
  }
}
