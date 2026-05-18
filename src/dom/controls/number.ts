import type { NumberController } from '../../core/types';
import { generateId } from '../../utils/generateId';
import { displayDecimals, roundToStep, getStep } from '../../utils/math';
import { createRow } from './row';

/* ---------------------------------- */
/* Utils                              */
/* ---------------------------------- */

function getMultiplier(e: { shiftKey?: boolean; altKey?: boolean }) {
  let m = 1;
  if (e.shiftKey) m *= 10;
  if (e.altKey) m *= 0.1;
  return m;
}

function clamp(v: number, min?: number, max?: number) {
  if (min !== undefined) v = Math.max(v, min);
  if (max !== undefined) v = Math.min(v, max);
  return v;
}

/* ---------------------------------- */
/* Main                               */
/* ---------------------------------- */

export function createNumberInput(key: string, controller: NumberController) {
  const isSlider = controller.min !== undefined && controller.max !== undefined;

  const { container, control, label } = createRow(() => controller.value);

  /* ---------- Input ---------- */

  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'leva__input leva__input--number';

  const elementId = generateId(`leva__${key}`);
  input.id = elementId;
  input.name = key;
  input.value = String(controller.value);
  input.autocomplete = 'off';
  input.spellcheck = false;

  label.htmlFor = elementId;
  label.textContent = controller.label;

  /* ---------- Slider DOM ---------- */

  const slider = createSlider();
  const stepper = createStepper();

  if (isSlider) {
    control.classList.add('leva__control--slider-parent');

    const secondary = control.cloneNode() as HTMLDivElement;
    secondary.classList.replace(
      'leva__control--slider-parent',
      'leva__control--secondary-number'
    );

    secondary.appendChild(input);
    control.append(slider.root, secondary);
  } else {
    control.classList.add('leva__control--number-parent');
    control.append(stepper, input);
  }

  /* ---------- Visibility Logic ---------- */

  const updateVisibility = (isVisible: boolean) => {
    container.style.display = isVisible === false ? 'none' : '';
  };

  updateVisibility(controller.visible);

  /* ---------- Sync ---------- */

  const sync = () => {
    input.classList.toggle('leva__input--slider', isSlider);
    input.classList.toggle('leva__input--number', !isSlider);

    if (controller.min !== undefined) input.min = String(controller.min);
    if (controller.max !== undefined) input.max = String(controller.max);

    input.step = String(getStep(controller.step));
  };

  const syncFromController = () => {
    const value = controller.value;
    const step = getStep(controller.step);

    if (!isSlider) {
      input.value = value.toFixed(value < 0 ? 2 : displayDecimals(value, step));
    } else {
      const min = controller.min ?? 0;
      const max = controller.max ?? 1;

      const x =
        max - min === 0
          ? 0
          : Math.min(Math.max((value - min) / (max - min), 0), 1);

      slider.root.style.setProperty('--percent', `${x * 100}%`);
      slider.root.style.setProperty('--raw-x', `${x}`);
      input.value = value.toFixed(displayDecimals(value, step));
    }

    if ('visible' in controller) {
      updateVisibility(controller.visible);
    }
  };

  /* ---------- Updates ---------- */

  const updateByStep = (dir: number, multiplier: number) => {
    const step = getStep(controller.step);
    const current = controller.value;

    const next = clamp(
      current + dir * step * multiplier,
      controller.min,
      controller.max
    );

    controller.set(roundToStep(next, step * multiplier));
  };

  /* ---------- Handlers ---------- */

  const handleInput = () => {
    const v = Number(input.value);
    if (!Number.isNaN(v)) controller.set(v);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    updateByStep(e.deltaY < 0 ? 1 : -1, getMultiplier(e));
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    updateByStep(e.key === 'ArrowUp' ? 1 : -1, getMultiplier(e));
  };

  const handleStepperPointerDown = () => {
    stepper.requestPointerLock();
    stepper.classList.add('leva__number--stepper-dragging');

    let acc = 0;

    const onMove = (ev: PointerEvent) => {
      const baseStep = getStep(controller.step);
      const multiplier = getMultiplier(ev);
      const effectiveStep = baseStep * multiplier;
      acc += ev.movementX;

      const STEP_PIXEL_RATIO = 10;
      const numSteps = Math.trunc(acc / STEP_PIXEL_RATIO);

      if (numSteps !== 0) {
        const next = clamp(
          controller.value + numSteps * effectiveStep,
          controller.min,
          controller.max
        );

        controller.set(roundToStep(next, effectiveStep));
        acc -= numSteps * STEP_PIXEL_RATIO;
      }
    };

    const onUp = () => {
      document.exitPointerLock();
      stepper.classList.remove('leva__number--stepper-dragging');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handleSliderPointerDown = (e: PointerEvent) => {
    const rect = slider.root.getBoundingClientRect();
    const buffer = 5;
    const width = rect.width - buffer * 2;

    const update = (ev: PointerEvent) => {
      const x = Math.min(
        Math.max((ev.clientX - rect.left - buffer) / width, 0),
        1
      );

      const min = controller.min ?? 0;
      const max = controller.max ?? 1;
      const step = getStep(controller.step);

      const raw = min + x * (max - min);
      controller.set(step > 0 ? roundToStep(raw, step) : raw);
    };

    slider.root.setPointerCapture(e.pointerId);
    update(e);

    slider.root.onpointermove = update;
    slider.root.onpointerup = () => {
      slider.root.releasePointerCapture(e.pointerId);
      slider.root.onpointermove = null;
      slider.root.onpointerup = null;
    };
  };

  const onPointerLockChange = () => {
    if (document.pointerLockElement !== stepper) {
      stepper.classList.remove('leva__number--stepper-dragging');
    }
  };

  /* ---------- Bind ---------- */

  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeydown);

  slider.root.addEventListener('pointerdown', handleSliderPointerDown);
  stepper.onpointerdown = handleStepperPointerDown;

  const targets = isSlider ? [slider.root, input] : [stepper, input];
  targets.forEach((t) =>
    t.addEventListener('wheel', handleWheel, { passive: false })
  );

  document.addEventListener('pointerlockchange', onPointerLockChange);

  const unsubscribe = controller.onChange(syncFromController);

  /* ---------- Init ---------- */

  sync();
  syncFromController();

  const cleanup = () => {
    input.removeEventListener('input', handleInput);
    input.removeEventListener('keydown', handleKeydown);
    slider.root.removeEventListener('pointerdown', handleSliderPointerDown);
    stepper.onpointerdown = null;
    targets.forEach((t) => t.removeEventListener('wheel', handleWheel));
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    unsubscribe();
    container.remove();
  };
  controller.onDispose(cleanup);

  return container;
}

/* ---------------------------------- */
/* Sub-components                     */
/* ---------------------------------- */

function createSlider() {
  const root = document.createElement('div');
  root.className = 'leva__slider';

  const track = document.createElement('div');
  track.className = 'leva__slider--track';

  const progress = document.createElement('div');
  progress.className = 'leva__slider--progress';

  const thumb = document.createElement('div');
  thumb.className = 'leva__slider--thumb';

  track.append(progress);
  root.append(track, thumb);

  return { root, track, progress, thumb };
}

function createStepper() {
  const el = document.createElement('div');
  el.className = 'leva__number--stepper';
  el.innerHTML = 'V';
  return el;
}
