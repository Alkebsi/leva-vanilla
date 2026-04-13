import type Controller from '../../core/Controller';
import icons from '../../icons';
import { internalsOf } from '../../utils/types';

export default class Row<O extends object, K extends keyof O> {
  elementContainer = document.createElement('div');
  element = document.createElement('div');

  labelContainer = document.createElement('div');
  label = document.createElement('label');

  control = document.createElement('div');
  clipboardBtn = document.createElement('div');

  private _isAnimating = false;

  constructor(container: HTMLElement, controller: Controller<O, K>) {
    const internals = internalsOf(controller);
    const name = String(internals.key);

    this.elementContainer.className = 'leva__row-container';
    this.element.className = 'leva__row';
    this.labelContainer.className = 'leva__label-container';
    this.label.className = 'leva__label';
    this.control.className = 'leva__control';

    this.clipboardBtn.className = 'leva__clipboard-btn';
    this.clipboardBtn.innerHTML = icons.clipboard;

    this.clipboardBtn.onclick = async () => {
      if (this._isAnimating) return;

      const value = controller.get();
      const textToCopy =
        typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value);

      try {
        await navigator.clipboard.writeText(textToCopy);
        this._runFlash();
      } catch (err) {
        console.error('Copy failed', err);
      }
    };

    this.label.textContent = name;
    this.label.htmlFor = name;
    this.labelContainer.append(this.label, this.clipboardBtn);

    this.element.append(this.labelContainer, this.control);
    this.elementContainer.appendChild(this.element);
    container.appendChild(this.elementContainer);
  }

  private _runFlash() {
    this._isAnimating = true;

    const anim = this.control.animate(
      [
        { left: '-100%', offset: 0 },
        { left: '0%', offset: 0.2 },
        { left: '0%', offset: 0.8 },
        { left: '100%', offset: 1 },
      ],
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::before',
        fill: 'none',
      }
    );

    anim.onfinish = () => {
      this._isAnimating = false;
    };
  }
}
