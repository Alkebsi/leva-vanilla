import { createRow } from './row';
import { generateId } from '../../utils/generateId';
import type { ButtonController } from '../../core/types';

export function createButtonInput(key: string, controller: ButtonController) {
  const { row, container, control, label, labelContainer } = createRow();

  const button = document.createElement('button');
  button.className = 'leva__input leva__input--button';

  const elementId = generateId(`leva__${key}`);
  button.id = elementId;
  button.name = key;

  label.remove();
  row.classList.add('leva__row--button');

  /* ---------- Visibility Logic ---------- */

  const updateVisibility = (isVisible: boolean) => {
    container.classList.toggle('visibility-hidden', !isVisible);
  };

  const unsubscribeVisibility = controller.onVisibleChange(updateVisibility);

  /* ---------- Sync ---------- */

  const sync = () => {
    button.textContent = controller.label;
    button.disabled = !!controller.disabled;
    button.classList.toggle('disabled', !!controller.disabled);

    if ('visible' in controller) {
      updateVisibility(controller.visible);
    }
  };

  const handleClick = () => {
    if (!controller.disabled) {
      controller.trigger();
    }
  };

  button.addEventListener('click', handleClick);

  const cleanup = () => {
    button.removeEventListener('click', handleClick);
    unsubscribeVisibility();
    container.remove();
  };

  controller.onDispose(cleanup);

  control.classList.add('leva__control--button-parent');
  control.appendChild(button);
  labelContainer.remove();

  sync();

  return container;
}
