// Interfaz de diálogo/ejercicio en DOM (overlay sobre el canvas).
// No sabe nada de Three.js: recibe un NPC con datos de diálogo y maneja
// la elección de opciones con feedback de acierto/error.

export class DialogUI {
  constructor() {
    this.panel = document.createElement('div');
    this.panel.id = 'dialog';
    this.panel.hidden = true;
    this.panel.innerHTML = `
      <div class="dialog-header">
        <span class="dialog-name"></span>
        <button class="dialog-close" type="button" aria-label="Cerrar">×</button>
      </div>
      <p class="dialog-response"></p>
      <p class="dialog-feedback" hidden></p>
      <p class="dialog-prompt"></p>
      <div class="dialog-options"></div>
      <button class="dialog-retry" type="button" hidden>Practicar otra vez</button>
    `;
    document.body.appendChild(this.panel);

    this.nameEl = this.panel.querySelector('.dialog-name');
    this.responseEl = this.panel.querySelector('.dialog-response');
    this.feedbackEl = this.panel.querySelector('.dialog-feedback');
    this.promptEl = this.panel.querySelector('.dialog-prompt');
    this.optionsEl = this.panel.querySelector('.dialog-options');
    this.retryEl = this.panel.querySelector('.dialog-retry');

    this.panel.querySelector('.dialog-close').addEventListener('click', () => this.close());
    this.retryEl.addEventListener('click', () => this.open(this.npc));

    this.npc = null;
  }

  get isOpen() {
    return !this.panel.hidden;
  }

  open(npc) {
    this.npc = npc;
    const dialog = npc.dialog;

    this.nameEl.textContent = npc.name;
    this.responseEl.textContent = dialog.npcLine;
    this.promptEl.textContent = dialog.prompt;

    this.feedbackEl.hidden = true;
    this.feedbackEl.className = 'dialog-feedback';
    this.retryEl.hidden = true;

    this.optionsEl.innerHTML = '';
    for (const option of dialog.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dialog-option';
      button.textContent = option.text;
      button.addEventListener('click', () => this._choose(button, option));
      this.optionsEl.appendChild(button);
    }

    this.panel.hidden = false;
  }

  _choose(button, option) {
    this.feedbackEl.hidden = false;
    this.feedbackEl.textContent = option.feedback;

    if (option.correct) {
      this.feedbackEl.className = 'dialog-feedback ok';
      button.classList.add('correct');
      // Ejercicio completado: se bloquean las opciones y se ofrece reintentar
      for (const b of this.optionsEl.children) b.disabled = true;
      this.retryEl.hidden = false;
    } else {
      this.feedbackEl.className = 'dialog-feedback error';
      // La opción fallida queda marcada y deshabilitada; se puede seguir intentando
      button.classList.add('incorrect');
      button.disabled = true;
    }
  }

  close() {
    this.panel.hidden = true;
    this.npc = null;
  }
}
