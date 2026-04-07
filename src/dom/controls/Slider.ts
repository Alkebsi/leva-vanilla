import type NumericController from '../../core/NumericController';
import Row from './Row';
import { internalsOf } from '../../utils/types';
import { displayDecimals, roundToStep, getStep } from '../../utils/math';

export default class Slider<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: NumericController<O, K>) {
    const isSlider =
      controller.minValue !== undefined && controller.maxValue !== undefined;

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

      input.step = String(getStep(controller.stepValue));
    };
    sync();

    input.oninput = () => {
      controller.set(Number(input.value) as O[K]);
    };

    // Slider DOM
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

    // Number DOM
    const numberStepper = document.createElement('div');
    numberStepper.className = 'leva__number--stepper';
    numberStepper.innerHTML = 'V';

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
      row.control.classList.add('leva__control--number-parent');
      row.control.append(numberStepper, input);
    }

    internals.onOptionsChange(sync);
    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || String(internals.key);
    });

    // Number stepper interaction
    numberStepper.onpointerdown = () => {
      numberStepper.requestPointerLock();
      numberStepper.classList.add('leva__number--stepper-dragging');

      const BASE_SENSITIVITY = 0.1; // pixels -> fraction of step
      let acc = 0;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const step = getStep(controller.stepValue);
        const current = Number(controller.get());
        const fine = moveEvent.shiftKey ? 0.1 : 1;
        const sens = BASE_SENSITIVITY * fine;
        acc += moveEvent.movementX * sens;

        const deltaValue = acc * step;
        const newValue = roundToStep(current + deltaValue, step);
        if (newValue !== current) {
          controller.set(newValue as O[K]);
          acc = 0;
        }
      };

      const onPointerUp = () => {
        document.exitPointerLock();
        numberStepper.classList.remove('leva__number--stepper-dragging');
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== numberStepper) {
        numberStepper.classList.remove('leva__number--stepper-dragging');
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Slider interaction
    const sliderInteract = (e: PointerEvent, slider: HTMLElement) => {
      const rect = slider.getBoundingClientRect();
      const buffer = 5;
      const availableWidth = rect.width - buffer * 2;

      const updateValue = (moveEvent: PointerEvent) => {
        const pointerX = moveEvent.clientX - rect.left - buffer;
        const x = Math.min(Math.max(pointerX / availableWidth, 0), 1);

        const min = controller.minValue ?? 0;
        const max = controller.maxValue ?? 1;
        const step = getStep(controller.stepValue);

        const raw = min + x * (max - min);
        const value = step > 0 ? roundToStep(raw, step) : raw;
        controller.set(value as O[K]);

        const uiValueRaw = max - min === 0 ? 0 : (value - min) / (max - min);
        const uiValue = Math.min(Math.max(uiValueRaw, 0), 1);

        slider.style.setProperty('--percent', `${uiValue * 100}%`);
        slider.style.setProperty('--raw-x', `${uiValue}`);

        const decimals = displayDecimals(Number(value), step);
        input.value = Number(value).toFixed(decimals);
      };

      slider.setPointerCapture(e.pointerId);
      updateValue(e);

      slider.onpointermove = updateValue;

      slider.onpointerup = () => {
        slider.releasePointerCapture(e.pointerId);
        slider.onpointermove = null;
        slider.onpointerup = null;
      };
    };

    const onPointerDown = (e: PointerEvent) =>
      sliderInteract(e, domReplacement);
    domReplacement.addEventListener('pointerdown', onPointerDown);

    const ctrl = controller as unknown as { destroy: () => void };
    const originalDestroy = ctrl.destroy.bind(ctrl);
    ctrl.destroy = () => {
      domReplacement.removeEventListener('pointerdown', onPointerDown);

      domReplacement.onpointermove = null;
      domReplacement.onpointerup = null;

      numberStepper.onpointerdown = null;
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      originalDestroy();
    };

    const syncFromController = () => {
      const value = Number(controller.get());

      if (!isSlider) {
        const step = controller.stepValue ?? 0.01;

        const decimals = value < 0 ? 2 : displayDecimals(value, step);
        input.value = value.toFixed(decimals);
        return;
      }

      const min = controller.minValue ?? 0;
      const max = controller.maxValue ?? 1;

      const step = getStep(controller.stepValue);
      const x = max - min === 0 ? 0 : (value - min) / (max - min);
      const clampedX = Math.min(Math.max(x, 0), 1);

      domReplacement.style.setProperty('--percent', `${clampedX * 100}%`);
      domReplacement.style.setProperty('--raw-x', `${clampedX}`);

      const decimals = displayDecimals(value, step);
      input.value = value.toFixed(decimals);
    };

    controller.onChange(syncFromController);
    syncFromController();
  }
}
