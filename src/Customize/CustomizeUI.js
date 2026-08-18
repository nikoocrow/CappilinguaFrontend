import { OUTFIT_SLOTS, SKIN_TONES } from '../Experience/World/characterConfig.js';

// Panel DOM superpuesto al canvas (mismo criterio que DialogUI.js): no sabe
// nada de Three.js, solo lee/escribe la selección actual en CharacterStage.
export class CustomizeUI {
  constructor(stage) {
    this.stage = stage;

    this.panel = document.createElement('div');
    this.panel.id = 'customize-panel';
    this.panel.innerHTML = `
      <h1>Personalizá tu personaje</h1>
      <button type="button" class="customize-randomize">🎲 Aleatorio</button>
      <div class="customize-slots"></div>
      <div class="customize-skin">
        <span class="customize-slot-label">Color de piel</span>
        <div class="customize-skin-swatches"></div>
        <input type="color" class="customize-skin-picker" aria-label="Color de piel personalizado" />
      </div>
      <button type="button" class="customize-save">Guardar</button>
    `;
    document.body.appendChild(this.panel);

    // Referencias por slot/piel que usa _buildRandomize() para saltar a un
    // índice/color arbitrario sin duplicar la lógica de aplicar+persistir.
    this._slotPickers = [];
    this._skinPicker = null;

    this._buildSlots();
    this._buildSkin();
    this._buildRandomize();
    this._buildSave();
  }

  _buildSave() {
    const button = this.panel.querySelector('.customize-save');
    button.addEventListener('click', () => {
      this.stage.save();
      window.location.href = './index.html';
    });
  }

  _buildRandomize() {
    const button = this.panel.querySelector('.customize-randomize');
    button.addEventListener('click', () => {
      for (const pick of this._slotPickers) {
        pick(Math.floor(Math.random() * pick.optionCount));
      }
      this._skinPicker(SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].color);
    });
  }

  _buildSlots() {
    const container = this.panel.querySelector('.customize-slots');

    for (const slot of OUTFIT_SLOTS) {
      const row = document.createElement('div');
      row.className = 'customize-slot';

      const label = document.createElement('span');
      label.className = 'customize-slot-label';
      label.textContent = slot.label;

      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'customize-slot-arrow';
      prev.textContent = '◀';
      prev.setAttribute('aria-label', `${slot.label} anterior`);

      const value = document.createElement('span');
      value.className = 'customize-slot-value';

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'customize-slot-arrow';
      next.textContent = '▶';
      next.setAttribute('aria-label', `${slot.label} siguiente`);

      const initialIndex = slot.options.findIndex((option) => option.mesh === this.stage.config.selection[slot.key]);
      let index = initialIndex === -1 ? 0 : initialIndex;

      const render = () => {
        value.textContent = slot.options[index].label;
      };
      const pick = (newIndex) => {
        index = ((newIndex % slot.options.length) + slot.options.length) % slot.options.length;
        this.stage.setSlotOption(slot.key, slot.options[index].mesh);
        render();
      };

      prev.addEventListener('click', () => pick(index - 1));
      next.addEventListener('click', () => pick(index + 1));
      render();

      pick.optionCount = slot.options.length;
      this._slotPickers.push(pick);

      row.append(label, prev, value, next);
      container.appendChild(row);
    }
  }

  _buildSkin() {
    const swatches = this.panel.querySelector('.customize-skin-swatches');
    const picker = this.panel.querySelector('.customize-skin-picker');
    picker.value = this.stage.config.skinColor;

    this._skinPicker = (hex) => {
      this.stage.setSkinColor(hex);
      picker.value = hex;
    };

    for (const tone of SKIN_TONES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'customize-skin-swatch';
      button.style.background = tone.color;
      button.title = tone.label;
      button.setAttribute('aria-label', tone.label);
      button.addEventListener('click', () => this._skinPicker(tone.color));
      swatches.appendChild(button);
    }

    picker.addEventListener('input', () => this.stage.setSkinColor(picker.value));
  }
}
