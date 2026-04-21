import type ValueController from '../../core/ValueController';
import Row from './Row';
import { internalsOf } from '../../utils/types';
import { generateId } from '../../utils/generateId';

export default class Text<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: ValueController<O, K>) {
    const input = document.createElement('input');
    input.className = 'leva__input';
    input.classList.add('leva__input--text');

    input.value = String(controller.get());
    input.autocomplete = 'off';
    input.spellcheck = false;

    input.oninput = () => {
      controller.set(input.value as O[K]);
    };

    const internals = internalsOf(controller);
    const key = String(internals.key);
    const elementId = generateId(`leva_${key}`);

    input.name = key;
    input.id = elementId;

    const row = new Row(container, controller);
    row.label.htmlFor = elementId;

    row.control.append(input);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || key;
    });
  }
}
