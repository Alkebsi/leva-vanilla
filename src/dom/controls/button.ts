import { createRow } from './row';
import { generateId } from '../../utils/generateId';

type ButtonController = {
  key: string;
  type: 'button';
  trigger: () => void;
  label: string;
  disabled?: boolean;
  onChange?: (fn: () => void) => () => void;
};

export function createButtonInput(key: string, controller: ButtonController) {
  const { row, container, control, label, labelContainer } = createRow();

  const button = document.createElement('button');
  button.className = 'leva__input leva__input--button';

  const elementId = generateId(`leva__${key}`);
  button.id = elementId;
  button.name = key;

  label.remove();
  row.classList.add('leva__row--button');

  const sync = () => {
    button.textContent = controller.label;
    button.disabled = !!controller.disabled;
    button.classList.toggle('disabled', !!controller.disabled);
  };

  const handleClick = () => {
    if (!controller.disabled) {
      controller.trigger();
    }
  };

  button.addEventListener('click', handleClick);

  // controller.onChange?.(sync);

  control.appendChild(button);
  labelContainer.remove();
  row.classList.add('leva__row--button');

  sync();

  return container;
}
