import type { ColorController } from '../../core/types';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';
import {
  parseColor,
  normalizedToHex,
  rgbToHsv,
  hsvToRgb,
  type HSV,
} from '../../utils/color';

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

// Helper to check if the initial color format supports alpha
const detectAlphaSupport = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return (
      value.length === 9 || // #rrggbbaa
      value.length === 5 || // #rgba
      value.startsWith('rgba') ||
      value.startsWith('hsla')
    );
  }
  if (typeof value === 'object' && value !== null) {
    return 'a' in value; // Catches {r,g,b,a} objects
  }
  return false;
};

export function createColorInput(
  key: string,
  controller: ColorController
): HTMLElement {
  const { container, control, label } = createRow(() => controller.value);
  const elementId = generateId(`leva__${key}`);

  label.htmlFor = elementId;
  label.textContent = controller.label;
  control.classList.add('leva__control--color-parent');

  let hsv: HSV = { h: 0, s: 0, v: 0, a: 1 };
  let isDragging = false;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  // Determine if this specific controller needs an alpha track
  const hasAlpha = detectAlphaSupport(controller.value);

  /* ---------- DOM Setup ---------- */

  const preview = document.createElement('div');
  preview.className = 'leva__input leva__input--fake-color';

  const popover = document.createElement('div');
  popover.className = 'leva__color--popover leva__popover--hidden';
  document.body.appendChild(popover);

  const svSquare = document.createElement('div');
  svSquare.className = 'leva__color--sv-square';
  const svHandle = document.createElement('div');
  svHandle.className = 'leva__color--handle';
  svSquare.appendChild(svHandle);

  const hueSlider = document.createElement('div');
  hueSlider.className = 'leva__color--hue-slider';
  const hueHandle = document.createElement('div');
  hueHandle.className = 'leva__color--handle';
  hueHandle.style.top = '50%';
  hueSlider.appendChild(hueHandle);

  // Dynamic Alpha DOM
  let alphaSlider: HTMLDivElement | null = null;
  let alphaGradient: HTMLDivElement | null = null;
  let alphaHandle: HTMLDivElement | null = null;

  if (hasAlpha) {
    const slidersParent = document.createElement('div');
    slidersParent.className = 'leva__color--sliders-parent';

    alphaSlider = document.createElement('div');
    alphaSlider.className = 'leva__color--alpha-slider';

    alphaGradient = document.createElement('div');
    alphaGradient.className = 'leva__color--alpha-gradient';

    alphaHandle = document.createElement('div');
    alphaHandle.className = 'leva__color--handle';
    alphaHandle.style.top = '50%';

    alphaSlider.append(alphaGradient, alphaHandle);
    slidersParent.append(hueSlider, alphaSlider);
    popover.append(svSquare, slidersParent);
  } else {
    popover.append(svSquare, hueSlider);
  }

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'leva__input leva__input--color-text';
  textInput.id = elementId;
  textInput.autocomplete = 'off';
  textInput.spellcheck = false;

  const textContainer = document.createElement('div');
  textContainer.className = 'leva__control leva__control--secondary-color';
  textContainer.appendChild(textInput);

  control.append(preview, textContainer);

  /* ---------- Internal Logic ---------- */

  const updatePopoverPosition = (): void => {
    if (popover.classList.contains('leva__popover--hidden')) return;
    const rect = preview.getBoundingClientRect();
    popover.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      left: ${rect.left}px;
      z-index: 100000;
    `;
  };

  const renderPickerVisuals = (currentHsv: HSV): void => {
    svSquare.style.backgroundColor = `hsl(${currentHsv.h * 360}, 100%, 50%)`;
    svHandle.style.left = `${currentHsv.s * 100}%`;
    svHandle.style.top = `${(1 - currentHsv.v) * 100}%`;
    hueHandle.style.left = `${currentHsv.h * 100}%`;

    if (hasAlpha && alphaHandle && alphaGradient) {
      alphaHandle.style.left = `${currentHsv.a * 100}%`;

      // Calculate solid color hex to render the alpha gradient overlay safely
      const solidRgb = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v, 1);
      const solidHex = normalizedToHex(solidRgb).slice(0, 7); // Strip any alpha chars
      alphaGradient.style.backgroundImage = `linear-gradient(to right, transparent, ${solidHex})`;
    }
  };

  const clearHideTimeout = (): void => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };

  const startHideTimeout = (): void => {
    if (isDragging) return;
    clearHideTimeout();
    hideTimeout = setTimeout(() => {
      popover.classList.add('leva__popover--hidden');
      window.removeEventListener('scroll', updatePopoverPosition);
    }, 1000);
  };

  const updateFromPointer = (
    e: PointerEvent,
    type: 'sv' | 'hue' | 'alpha'
  ): void => {
    const target =
      type === 'sv' ? svSquare : type === 'hue' ? hueSlider : alphaSlider!;
    const rect = target.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);

    if (type === 'sv') {
      hsv.s = x;
      hsv.v = 1 - y;
    } else if (type === 'hue') {
      hsv.h = x;
    } else if (type === 'alpha') {
      hsv.a = x;
    }

    renderPickerVisuals(hsv);
    const rgba = hsvToRgb(hsv.h, hsv.s, hsv.v, hsv.a);
    controller.set(normalizedToHex(rgba));
  };

  const setupDrag = (el: HTMLElement, type: 'sv' | 'hue' | 'alpha'): void => {
    const onMove = (e: PointerEvent): void => updateFromPointer(e, type);
    const onUp = (): void => {
      isDragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      startHideTimeout();
    };

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      isDragging = true;
      clearHideTimeout();
      el.setPointerCapture(e.pointerId);
      updateFromPointer(e, type);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  };

  setupDrag(svSquare, 'sv');
  setupDrag(hueSlider, 'hue');
  if (hasAlpha && alphaSlider) {
    setupDrag(alphaSlider, 'alpha');
  }

  /* ---------- Event Listeners ---------- */

  preview.addEventListener('click', () => {
    const isHidden = popover.classList.toggle('leva__popover--hidden');
    if (!isHidden) {
      updatePopoverPosition();
      window.addEventListener('scroll', updatePopoverPosition, {
        passive: true,
      });
      clearHideTimeout();
    } else {
      window.removeEventListener('scroll', updatePopoverPosition);
    }
  });

  const onWindowClick = (e: MouseEvent): void => {
    if (!popover.contains(e.target as Node) && e.target !== preview) {
      popover.classList.add('leva__popover--hidden');
      window.removeEventListener('scroll', updatePopoverPosition);
    }
  };

  window.addEventListener('click', onWindowClick);
  popover.addEventListener('mouseenter', clearHideTimeout);
  popover.addEventListener('mouseleave', startHideTimeout);
  preview.addEventListener('mouseenter', clearHideTimeout);
  preview.addEventListener('mouseleave', startHideTimeout);

  /* ---------- Synchronization ---------- */

  const syncUI = (): void => {
    const { value } = controller;
    const parsed = parseColor(value);

    if (parsed) {
      const hex = normalizedToHex(parsed.rgba);
      if (textInput.value !== hex) textInput.value = hex;
      preview.style.backgroundColor = hex;

      if (!isDragging) {
        hsv = rgbToHsv(
          parsed.rgba.r,
          parsed.rgba.g,
          parsed.rgba.b,
          parsed.rgba.a
        );
        renderPickerVisuals(hsv);
      }
    } else {
      const fallback = String(value);
      if (textInput.value !== fallback) textInput.value = fallback;
      preview.style.backgroundColor = fallback;
    }
  };

  const handleTextChange = (): void => {
    const parsed = parseColor(textInput.value);
    if (parsed) controller.set(textInput.value);
    else syncUI();
  };

  textInput.addEventListener('change', handleTextChange);

  /* ---------- Lifecycle ---------- */

  const unsubscribeChange = controller.onChange(syncUI);
  const unsubscribeVisibility = controller.onVisibleChange((v: boolean) => {
    container.classList.toggle('visibility-hidden', !v);
    if (!v) popover.classList.add('leva__popover--hidden');
  });

  syncUI();

  const cleanup = (): void => {
    window.removeEventListener('click', onWindowClick);
    window.removeEventListener('scroll', updatePopoverPosition);
    textInput.removeEventListener('change', handleTextChange);
    popover.removeEventListener('mouseenter', clearHideTimeout);
    popover.removeEventListener('mouseleave', startHideTimeout);
    preview.removeEventListener('mouseenter', clearHideTimeout);
    preview.removeEventListener('mouseleave', startHideTimeout);

    clearHideTimeout();
    unsubscribeChange();
    unsubscribeVisibility();
    popover.remove();
    container.remove();
  };

  controller.onDispose(cleanup);

  return container;
}
