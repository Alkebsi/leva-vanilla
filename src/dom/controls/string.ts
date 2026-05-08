import type { StringController } from '../../core/types';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';

export function createStringInput(key: string, controller: StringController) {
  const { container, control, label } = createRow(() => controller.value);

  /* ---------- Input ---------- */

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'leva__input leva__input--string';

  const elementId = generateId(`leva__${key}`);
  input.id = elementId;
  input.name = key;
  input.value = String(controller.value);
  input.autocomplete = 'off';
  input.spellcheck = false;

  label.htmlFor = elementId;
  label.textContent = controller.label;

  control.append(input);

  const syncFromController = () => {
    const value = controller.value;
    input.value = value;
  };

  input.addEventListener('input', () => {
    controller.set(input.value);
  });

  controller.onChange(syncFromController);

  syncFromController();

  return container;
}
