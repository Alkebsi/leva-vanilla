import type { BooleanController } from '../../core/types';
import icons from '../../icons';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';

export function createBooleanInput(key: string, controller: BooleanController) {
  const { container, control, label } = createRow(() => controller.value);

  const input = document.createElement('input');
  input.className = 'leva__input leva__input--checkbox';
  input.type = 'checkbox';

  const elementId = generateId(`leva__${key}`);

  input.checked = controller.value;
  input.name = key;
  input.id = elementId;

  const domReplacement = document.createElement('label');
  domReplacement.className = 'leva__input--checkbox-label';
  domReplacement.innerHTML = icons.checkbox;

  const handleChange = () => controller.set(input.checked);
  input.addEventListener('change', handleChange);

  const sync = (v: boolean) => (input.checked = v);
  const unsubscribe = controller.onChange(sync);

  label.htmlFor = elementId;
  label.textContent = controller.label;

  control.classList.add('leva__control--checkbox-parent');
  control.appendChild(input);

  domReplacement.htmlFor = elementId;
  control.append(domReplacement);

  const cleanup = () => {
    input.removeEventListener('change', handleChange);
    unsubscribe();
    container.remove();
  };

  controller.onDispose(cleanup);

  return container;
}
