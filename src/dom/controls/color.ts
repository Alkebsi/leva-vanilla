import type { ColorController } from '../../core/types';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';
import { parseColor, normalizedToHex } from '../../utils/color';

export function createColorInput(key: string, controller: ColorController) {
  const { container, control, label } = createRow(() => controller.value);

  const elementId = generateId(`leva__${key}`);
  label.htmlFor = elementId;
  label.textContent = controller.label;

  control.classList.add('leva__control--color-parent');

  /* ---------- Picker ---------- */

  const picker = document.createElement('input');
  picker.type = 'color';
  picker.className = 'leva__input leva__input--color-picker';
  picker.id = generateId(`leva__${key}_picker`);

  /* ---------- Preview / Fake Color ---------- */

  const preview = document.createElement('div');
  preview.className = 'leva__input leva__input--fake-color';
  preview.onclick = () => picker.click();

  /* ---------- Text Input ---------- */

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'leva__input leva__input--color-text';
  textInput.id = elementId;
  textInput.autocomplete = 'off';
  textInput.spellcheck = false;

  const textContainer = document.createElement('div');
  textContainer.className = 'leva__control leva__control--secondary-color';
  textContainer.appendChild(textInput);

  /* ---------- Assembly ---------- */

  control.append(picker, preview, textContainer);

  /* ---------- Logic ---------- */

  const syncUI = () => {
    const value = controller.value;
    if (textInput.value !== value) textInput.value = value;

    const parsed = parseColor(value);
    if (parsed) {
      const hex = normalizedToHex(parsed.normalized);
      if (picker.value !== hex) picker.value = hex;
      preview.style.backgroundColor = hex;
    } else {
      preview.style.backgroundColor = value;
    }
  };

  picker.addEventListener('input', () => {
    controller.set(picker.value);
  });

  textInput.addEventListener('change', () => {
    const parsed = parseColor(textInput.value);
    if (parsed && parsed.kind === 'string') {
      controller.set(textInput.value);
    } else {
      syncUI();
    }
  });

  controller.onChange(syncUI);

  // Init
  syncUI();

  return container;
}
