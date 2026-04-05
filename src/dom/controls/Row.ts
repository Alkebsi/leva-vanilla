import type Controller from '../../core/Controller';
import { internalsOf } from '../../utils/types';

export default class Row<O extends object, K extends keyof O> {
  elementContainer = document.createElement('div');
  element = document.createElement('div');

  labelContainer = document.createElement('div');
  label = document.createElement('label');

  control = document.createElement('div');

  constructor(container: HTMLElement, controller: Controller<O, K>) {
    const internals = internalsOf(controller);
    const name = String(internals.key);

    this.elementContainer.className = 'leva__row-container';
    this.element.className = 'leva__row';
    this.labelContainer.className = 'leva__label-container';
    this.label.className = 'leva__label';
    this.control.className = 'leva__control';

    this.label.textContent = name;
    this.label.htmlFor = name;
    this.labelContainer.appendChild(this.label);

    this.element.append(this.labelContainer, this.control);
    this.elementContainer.appendChild(this.element);
    container.appendChild(this.elementContainer);
  }
}
