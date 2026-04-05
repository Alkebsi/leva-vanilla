import ActionController from '../../core/ActionController';
import { internalsOf } from '../../utils/types';
import Row from './Row';

export default class Action<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: ActionController<O, K>) {
    const input = document.createElement('input');
    input.className = 'leva__input';
    input.classList.add('leva__input--button');
    input.type = 'button';

    const internals = internalsOf(controller);
    const key = String(internals.key);
    input.value = key;
    input.name = key;
    input.id = key;

    const row = new Row(container, controller);
    row.control.append(input);
    row.labelContainer.remove();
    row.element.classList.add('leva__row--button');

    if (!input.disabled) {
      input.onclick = () => {
        controller.trigger();
      };
    }
  }
}
