import icons from '../icons';
import GUIContainer from './GUIContainer';

export default class Folder extends GUIContainer {
  private wrapper: HTMLDivElement;
  private content: HTMLDivElement;
  private _heightAnim?: Animation;
  private _iconAnim?: Animation;

  constructor(parent: HTMLElement, name: string) {
    const wrapper = document.createElement('div');
    wrapper.className = 'leva__folder';

    const header = document.createElement('div');
    header.className = 'leva__folder-header';
    const headerTitle = document.createElement('div');
    headerTitle.textContent = name;
    header.innerHTML = icons.downArrow;
    header.append(headerTitle);

    const content = document.createElement('div');
    content.className = 'leva__content';
    content.classList.add('leva__folder-content');

    wrapper.appendChild(header);
    wrapper.appendChild(content);
    parent.appendChild(wrapper);

    super(content);

    this.wrapper = wrapper;
    this.content = content;

    header.onclick = () => this._toggle();
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }

  private _toggle(closeOnly?: boolean) {
    const wasOpen = this.isOpen;
    const targetOpen = closeOnly ? false : !wasOpen;
    this.isOpen = targetOpen;

    const content = this.content;
    const headerIcon = this.wrapper.querySelector('.leva__folder-header')
      ?.firstElementChild as HTMLElement | null;

    const currentHeight = content.getBoundingClientRect().height;
    const currentOpacity = window.getComputedStyle(content).opacity;

    content.getAnimations().forEach((anim) => anim.cancel());
    if (this._iconAnim) this._iconAnim.cancel();

    let currentRotation = wasOpen ? 0 : -90;
    if (headerIcon) {
      const style = window.getComputedStyle(headerIcon);
      const matrix = style.transform;
      if (matrix && matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        currentRotation = Math.round(
          Math.atan2(parseFloat(values[1]), parseFloat(values[0])) *
            (180 / Math.PI)
        );
      }
    }

    if (this.isOpen) {
      content.style.display = '';
      content.style.overflow = 'hidden';

      void content.offsetHeight;

      const fullHeight = content.scrollHeight;

      this._heightAnim = content.animate(
        [{ height: `${currentHeight}px` }, { height: `${fullHeight}px` }],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      content.animate([{ opacity: currentOpacity }, { opacity: 1 }], {
        duration: closeOnly ? 0 : 200,
        delay: closeOnly ? 0 : 200,
        easing: 'ease-out',
        fill: 'both',
      });

      this._heightAnim.onfinish = () => {
        if (this.isOpen) {
          content.style.height = 'auto';
          content.style.overflow = '';
          this._heightAnim?.cancel();
          this._heightAnim = undefined;
        }
      };

      if (headerIcon) {
        this._iconAnim = headerIcon.animate(
          [
            { transform: `rotate(${currentRotation}deg)` },
            { transform: 'rotate(0deg)' },
          ],
          { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
        );
      }
    } else {
      content.style.overflow = 'hidden';

      this._heightAnim = content.animate(
        [
          { height: `${currentHeight}px`, opacity: currentOpacity },
          { height: `0px`, opacity: 0 },
        ],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      this._heightAnim.onfinish = () => {
        if (!this.isOpen) {
          content.style.display = 'none';
          content.style.height = '';
          content.style.opacity = '0';
        }
        content.style.overflow = '';
        this._heightAnim?.cancel();
        this._heightAnim = undefined;
      };

      if (headerIcon) {
        this._iconAnim = headerIcon.animate(
          [
            { transform: `rotate(${currentRotation}deg)` },
            { transform: 'rotate(-90deg)' },
          ],
          { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
        );
      }
    }
  }

  close() {
    this._toggle(true);
    return this;
  }

  destroy() {
    super.destroy();
    this.wrapper.remove();
  }
}
