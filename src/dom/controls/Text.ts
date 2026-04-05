import type ValueController from '../../core/ValueController';
import Row from './Row';
import { internalsOf } from '../../utils/types';

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

    const row = new Row(container, controller);
    const internals = internalsOf(controller)
    input.name = String(internals.key);
    input.id = String(internals.key);

    row.control.append(input);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || String(internals.key);
    });
  }
}
