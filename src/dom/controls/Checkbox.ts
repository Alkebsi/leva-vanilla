import type BooleanController from '../../core/BooleanController';
import icons from '../../icons';
import { generateId } from '../../utils/generateId';
import { internalsOf } from '../../utils/types';
import Row from './Row';

export default class Checkbox<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: BooleanController<O, K>) {
    const input = document.createElement('input');
    input.type = 'checkbox';

    const internals = internalsOf(controller);
    const elementId = generateId(`leva__${String(internals.key)}`);
    const key = String(internals.key);

    input.className = 'leva__input';
    input.classList.toggle('leva__input--checkbox');
    input.name = key;
    input.id = elementId;

    const domReplacement = document.createElement('label');
    domReplacement.className = 'leva__input--checkbox-label';
    domReplacement.innerHTML = icons.checkbox;

    input.checked = Boolean(controller.get());

    input.oninput = () => {
      controller.set(input.checked as O[K]);
    };

    const row = new Row(container, controller);
    row.control.classList.add('leva__control--checkbox-parent');
    row.label.htmlFor = elementId;
    row.control.append(input);

    domReplacement.htmlFor = elementId;
    row.control.append(domReplacement);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || key;
    });
  }
}
