import GUI from 'lil-gui';

// Panel de ajuste en vivo (luces, sombras) para afinar calidad-vs-costo sin
// tocar código, más un overlay de FPS/draw calls. Solo se instancia si se
// navega con #debug en la URL.
export default class Debug {
  constructor() {
    this.active = window.location.hash === '#debug';

    if (this.active) {
      this.ui = new GUI();
      this.setStatsPanel();
    }
  }

  setStatsPanel() {
    this.statsEl = document.createElement('div');
    this.statsEl.id = 'debug-stats';
    Object.assign(this.statsEl.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      padding: '4px 8px',
      background: 'rgba(0, 0, 0, 0.6)',
      color: '#a3be8c',
      font: '12px/1.4 monospace',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      zIndex: 999,
    });
    document.body.appendChild(this.statsEl);

    this._frames = 0;
    this._statsLast = performance.now();
  }

  // Llamado desde Experience.update() solo si debug.active. Cuenta frames
  // por tick pero solo toca el DOM 2 veces por segundo, no por frame.
  updateStats(renderInfo) {
    this._frames++;
    const now = performance.now();
    const elapsed = now - this._statsLast;
    if (elapsed < 500) return;

    const fps = Math.round((this._frames * 1000) / elapsed);
    this.statsEl.textContent = `${fps} FPS\n${renderInfo.calls} draw calls\n${(renderInfo.triangles / 1000).toFixed(1)}k tris`;
    this._frames = 0;
    this._statsLast = now;
  }

  destroy() {
    if (!this.active) return;
    this.ui.destroy();
    this.statsEl.remove();
  }
}
