import type ColorController from '../../core/ColorController';
import Row from './Row';

import { normalizedToHex, parseColor } from '../../utils/color';
import { internalsOf } from '../../utils/types';
import { generateId } from '../../utils/generateId';

export default class Color<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: ColorController<O, K>) {
    const internals = internalsOf(controller);
    const key = String(internals.key);
    const elementId = generateId(`leva_${key}`);

    // inputs
    const text = document.createElement('input');
    const picker = document.createElement('input');

    text.type = 'text';
    picker.type = 'color';

    text.className = 'leva__input leva__input--color-text';
    picker.className = 'leva__input leva__input--color-picker';

    text.name = key;
    text.id = elementId;

    picker.name = key;
    picker.id = generateId(`leva_${key + '_picker'}`);

    text.autocomplete = 'off';
    text.spellcheck = false;

    const domReplacement = document.createElement('div');
    domReplacement.className = 'leva__input leva__input--fake-color';
    domReplacement.onclick = () => {
      picker.click();
    };

    const row = new Row(container, controller);
    row.control.classList.add('leva__control--color-parent');
    row.label.htmlFor = elementId;

    const secondaryControl = row.control.cloneNode() as HTMLDivElement;
    secondaryControl.classList.replace(
      'leva__control--color-parent',
      'leva__control--color-text'
    );
    secondaryControl.appendChild(text);

    row.control.append(picker, domReplacement, secondaryControl);

    const syncUI = () => {
      const hex = normalizedToHex(controller.normalized);

      if (text.value !== hex) text.value = hex;
      if (picker.value !== hex) picker.value = hex;
      domReplacement.style.setProperty('background', picker.value);
    };

    syncUI();

    picker.oninput = () => {
      const parsed = parseColor(picker.value);
      if (parsed) controller.setNormalized(parsed.normalized);
    };

    text.onchange = () => {
      const parsed = parseColor(text.value);

      if (!parsed) {
        text.value = normalizedToHex(controller.normalized);
        return;
      }

      controller.setNormalized(parsed.normalized);
    };

    controller.onChange(() => {
      controller.refreshFromValue();
      syncUI();
    });

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || key;
    });
  }
}
