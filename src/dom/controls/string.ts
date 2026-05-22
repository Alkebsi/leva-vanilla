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

  const updateVisibility = (isVisible: boolean) => {
    container.classList.toggle('visibility-hidden', !isVisible);
  };

  updateVisibility(controller.visible !== false);

  const syncFromController = () => {
    const value = controller.value;
    input.value = value;

    if ('visible' in controller) {
      updateVisibility(controller.visible);
    }
  };

  const handleInput = () => controller.set(input.value);
  input.addEventListener('input', handleInput);

  const unsubscribeChange = controller.onChange(syncFromController);
  const unsubscribeVisibility = controller.onVisibleChange(updateVisibility);

  syncFromController();

  const cleanup = () => {
    input.removeEventListener('input', handleInput);
    unsubscribeChange();
    unsubscribeVisibility();
    container.remove();
  };
  controller.onDispose(cleanup);

  return container;
}
