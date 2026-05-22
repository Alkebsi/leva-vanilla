import type { ColorController } from '../../core/types';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';
import {
  parseColor,
  normalizedToHex,
  normalizedToHex6,
} from '../../utils/color';

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

  /* ---------- Visibility Logic ---------- */

  const updateVisibility = (isVisible: boolean) => {
    container.classList.toggle('visibility-hidden', !isVisible);
  };

  const unsubscribeVisibility = controller.onVisibleChange(updateVisibility);

  /* ---------- Logic ---------- */

  const syncUI = () => {
    const value = controller.value;

    const parsed = parseColor(value);
    if (parsed) {
      const hex = normalizedToHex(parsed.rgba);
      if (textInput.value !== hex) textInput.value = hex;

      const hex6 = normalizedToHex6(parsed.rgba);
      if (picker.value !== hex6) picker.value = hex6;

      preview.style.backgroundColor = hex;
    } else {
      const fallback = String(value);
      if (textInput.value !== fallback) textInput.value = fallback;
      preview.style.backgroundColor = fallback;
    }

    if ('visible' in controller) {
      updateVisibility(controller.visible);
    }
  };

  const handlePickerInput = () => controller.set(picker.value);
  picker.addEventListener('input', handlePickerInput);

  const handleTextChange = () => {
    const parsed = parseColor(textInput.value);
    if (parsed) {
      controller.set(textInput.value);
    } else {
      syncUI();
    }
  };
  textInput.addEventListener('change', handleTextChange);

  const unsubscribeChange = controller.onChange(syncUI);

  // Init
  syncUI();

  const cleanup = () => {
    picker.removeEventListener('input', handlePickerInput);
    textInput.removeEventListener('change', handleTextChange);
    unsubscribeChange();
    unsubscribeVisibility();
    container.remove();
  };
  controller.onDispose(cleanup);

  return container;
}
