import type NumericController from '../../core/NumericController';
import Row from './Row';
import { internalsOf, type ControllerInternals } from '../../utils/types';
import { displayDecimals, roundToStep, getStep } from '../../utils/math';
import { generateId } from '../../utils/generateId';

export default class Slider<O extends object, K extends keyof O> {
  private readonly _controller: NumericController<O, K>;
  private readonly _input: HTMLInputElement;
  private readonly _domReplacement: HTMLDivElement;
  private readonly _numberStepper: HTMLDivElement;
  private readonly _scrollTargets: HTMLElement[];
  private readonly _isSlider: boolean;

  constructor(container: HTMLElement, controller: NumericController<O, K>) {
    this._controller = controller;
    this._isSlider =
      controller.minValue !== undefined && controller.maxValue !== undefined;

    const internals = internalsOf(controller);
    const key = String(internals.key);
    const elementId = generateId(`leva_${key}`);

    this._input = document.createElement('input');
    this._input.className = 'leva__input';
    this._input.value = String(controller.get());
    this._input.autocomplete = 'off';
    this._input.spellcheck = false;
    this._input.name = key;
    this._input.id = elementId;

    this._domReplacement = document.createElement('div');
    this._domReplacement.className = 'leva__slider';
    const sliderTrack = document.createElement('div');
    sliderTrack.className = 'leva__slider--track';
    const sliderProgress = document.createElement('div');
    sliderProgress.className = 'leva__slider--progress';
    const sliderThumb = document.createElement('div');
    sliderThumb.className = 'leva__slider--thumb';
    sliderTrack.append(sliderProgress);
    this._domReplacement.append(sliderTrack, sliderThumb);

    this._numberStepper = document.createElement('div');
    this._numberStepper.className = 'leva__number--stepper';
    this._numberStepper.innerHTML = 'V';

    const row = new Row(container, controller);
    if (this._isSlider) {
      row.control.classList.add('leva__control--slider-parent');
      const secondary = row.control.cloneNode() as HTMLDivElement;
      secondary.classList.replace(
        'leva__control--slider-parent',
        'leva__control--secondary-number'
      );
      secondary.appendChild(this._input);
      row.control.append(this._domReplacement, secondary);
    } else {
      row.control.classList.add('leva__control--number-parent');
      row.control.append(this._numberStepper, this._input);
    }

    row.label.htmlFor = elementId;
    this._scrollTargets = this._isSlider
      ? [this._domReplacement, this._input]
      : [this._numberStepper, this._input];

    this._attachEventListeners(internals, key);
    this._sync();
    this._syncFromController();

    const ctrl = controller;
    const originalDestroy = ctrl.destroy.bind(ctrl);
    ctrl.destroy = () => {
      this._detachEventListeners();
      originalDestroy();
    };
  }

  private _attachEventListeners(
    internals: ControllerInternals<O, K>,
    key: string
  ) {
    this._input.oninput = () =>
      this._controller.set(Number(this._input.value) as O[K]);
    this._input.addEventListener('keydown', this._handleKeydown);
    this._domReplacement.addEventListener(
      'pointerdown',
      this._handleSliderPointerDown
    );
    this._numberStepper.onpointerdown = this._handleStepperPointerDown;
    this._scrollTargets.forEach((t) =>
      t.addEventListener('wheel', this._handleWheel, { passive: false })
    );

    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    internals.onOptionsChange(this._sync);
    internals.onOptionsChange(() => {
      const rowLabel = this._input
        .closest('.leva__row')
        ?.querySelector('label');
      if (rowLabel) rowLabel.textContent = internals.getName() || key;
    });

    this._controller.onChange(this._syncFromController);
  }

  private _detachEventListeners() {
    this._domReplacement.removeEventListener(
      'pointerdown',
      this._handleSliderPointerDown
    );
    this._input.removeEventListener('keydown', this._handleKeydown);
    this._scrollTargets.forEach((t) =>
      t.removeEventListener('wheel', this._handleWheel)
    );
    document.removeEventListener(
      'pointerlockchange',
      this._onPointerLockChange
    );
    this._numberStepper.onpointerdown = null;
    this._input.oninput = null;
  }

  private _sync = () => {
    this._input.type = 'number';
    this._input.classList.toggle('leva__input--slider', this._isSlider);
    this._input.classList.toggle('leva__input--number', !this._isSlider);
    if (this._controller.minValue !== undefined)
      this._input.min = String(this._controller.minValue);
    if (this._controller.maxValue !== undefined)
      this._input.max = String(this._controller.maxValue);
    this._input.step = String(getStep(this._controller.stepValue));
  };

  private _syncFromController = () => {
    const value = Number(this._controller.get());
    const step = getStep(this._controller.stepValue);

    if (!this._isSlider) {
      this._input.value = value.toFixed(
        value < 0 ? 2 : displayDecimals(value, step)
      );
      return;
    }

    const min = this._controller.minValue ?? 0;
    const max = this._controller.maxValue ?? 1;
    const x =
      max - min === 0
        ? 0
        : Math.min(Math.max((value - min) / (max - min), 0), 1);

    this._domReplacement.style.setProperty('--percent', `${x * 100}%`);
    this._domReplacement.style.setProperty('--raw-x', `${x}`);
    this._input.value = value.toFixed(displayDecimals(value, step));
  };

  private _updateValueByStep(direction: number, multiplier: number) {
    const baseStep = getStep(this._controller.stepValue);
    const current = Number(this._controller.get());
    const delta = direction * baseStep * multiplier;
    let newValue = current + delta;

    if (this._controller.minValue !== undefined)
      newValue = Math.max(newValue, this._controller.minValue);
    if (this._controller.maxValue !== undefined)
      newValue = Math.min(newValue, this._controller.maxValue);

    this._controller.set(roundToStep(newValue, baseStep * multiplier) as O[K]);
  }

  private _handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    this._updateValueByStep(e.deltaY < 0 ? 1 : -1, multiplier);
  };

  private _handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const multiplier = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    this._updateValueByStep(e.key === 'ArrowUp' ? 1 : -1, multiplier);
  };

  private _handleStepperPointerDown = () => {
    this._numberStepper.requestPointerLock();
    this._numberStepper.classList.add('leva__number--stepper-dragging');
    const BASE_SENSITIVITY = 0.1;
    let acc = 0;

    const onPointerMove = (e: PointerEvent) => {
      const step = getStep(this._controller.stepValue);
      const sens = BASE_SENSITIVITY * (e.shiftKey ? 0.1 : 1);
      acc += e.movementX * sens;
      const deltaValue = acc * step;
      const newValue = roundToStep(
        Number(this._controller.get()) + deltaValue,
        step
      );
      if (newValue !== Number(this._controller.get())) {
        this._controller.set(newValue as O[K]);
        acc = 0;
      }
    };

    const onPointerUp = () => {
      document.exitPointerLock();
      this._numberStepper.classList.remove('leva__number--stepper-dragging');
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  private _handleSliderPointerDown = (e: PointerEvent) => {
    const rect = this._domReplacement.getBoundingClientRect();
    const buffer = 5;
    const availableWidth = rect.width - buffer * 2;

    const update = (moveEvent: PointerEvent) => {
      const x = Math.min(
        Math.max((moveEvent.clientX - rect.left - buffer) / availableWidth, 0),
        1
      );
      const min = this._controller.minValue ?? 0;
      const max = this._controller.maxValue ?? 1;
      const step = getStep(this._controller.stepValue);
      const raw = min + x * (max - min);
      this._controller.set((step > 0 ? roundToStep(raw, step) : raw) as O[K]);
    };

    this._domReplacement.setPointerCapture(e.pointerId);
    update(e);
    this._domReplacement.onpointermove = update;
    this._domReplacement.onpointerup = () => {
      this._domReplacement.releasePointerCapture(e.pointerId);
      this._domReplacement.onpointermove = null;
      this._domReplacement.onpointerup = null;
    };
  };

  private _onPointerLockChange = () => {
    if (document.pointerLockElement !== this._numberStepper) {
      this._numberStepper.classList.remove('leva__number--stepper-dragging');
    }
  };
}
