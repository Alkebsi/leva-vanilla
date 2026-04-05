import type NumericController from '../../core/NumericController';
import Row from './Row';
import { internalsOf } from '../../utils/types';

export default class Slider<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: NumericController<O, K>) {
    const isSlider = controller.minValue !== undefined && controller.maxValue !== undefined;

    const input = document.createElement('input');
    input.className = 'leva__input';

    input.value = String(controller.get());
    input.autocomplete = 'off';
    input.spellcheck = false;

  const internals = internalsOf(controller);
  input.name = String(internals.key);
  input.id = String(internals.key);

    const sync = () => {
      input.type = 'number';
      if (isSlider) {
        input.classList.add('leva__input--slider');
      } else {
        input.classList.add('leva__input--number');
      }

      if (controller.minValue !== undefined)
        input.min = String(controller.minValue);
      if (controller.maxValue !== undefined)
        input.max = String(controller.maxValue);
      if (controller.stepValue !== undefined)
        input.step = String(controller.stepValue);
    };
    sync();

    input.oninput = () => {
      controller.set(Number(input.value) as O[K]);
    };

    // Creating custom slider
    const domReplacement = document.createElement('div');
    domReplacement.className = 'leva__slider';

    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'leva__slider--track';

    const sliderProgress = document.createElement('div');
    sliderProgress.className = 'leva__slider--progress';

    const sliderThumb = document.createElement('div');
    sliderThumb.className = 'leva__slider--thumb';

    sliderTrack.append(sliderProgress);
    domReplacement.append(sliderTrack, sliderThumb);

    // bind them to input
    const row = new Row(container, controller);

    if (isSlider) {
      row.control.classList.add('leva__control--slider-parent');

      const secondaryControl = row.control.cloneNode() as HTMLDivElement;
      secondaryControl.classList.replace(
        'leva__control--slider-parent',
        'leva__control--secondary-number'
      );
      secondaryControl.appendChild(input);

      row.control.append(domReplacement, secondaryControl);
    } else {
      row.control.append(input);
    }

    internals.onOptionsChange(sync);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || String(internals.key);
    });
  }
}
