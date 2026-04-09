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

    header.onclick = () => this.toggle();
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }

  toggle() {
    const wasOpen = this.isOpen;
    this.isOpen = !wasOpen;

    const content = this.content;
    const headerIcon = this.wrapper.querySelector('.leva__folder-header')
      ?.firstElementChild as HTMLElement | null;

    this._heightAnim?.cancel();
    this._iconAnim?.cancel();

    if (this.isOpen) {
      // show then measure and animate height from 0 -> scrollHeight
      content.style.display = '';
      // batch measurement and writes to the next frame
      requestAnimationFrame(() => {
        const to = content.scrollHeight;

        content.style.overflow = 'hidden';
        content.style.willChange = 'height';
        // start from 0 so animation grows
        content.style.height = '0px';

        this._heightAnim = content.animate(
          [{ height: `0px` }, { height: `${to}px` }],
          { duration: 350, easing: 'ease' }
        );

        this._heightAnim.onfinish = () => {
          content.style.height = 'auto';
          content.style.overflow = '';
          content.style.willChange = '';
        };

        if (headerIcon) {
          this._iconAnim = headerIcon.animate(
            [{ transform: 'rotate(-90deg)' }, { transform: 'rotate(0deg)' }],
            { duration: 350, easing: 'ease', fill: 'forwards' }
          );
        }
      });
    } else {
      // closing: measure current height and animate to 0
      const from = content.scrollHeight || content.clientHeight || 0;
      content.style.overflow = 'hidden';
      content.style.willChange = 'height';
      content.style.height = `${from}px`;

      requestAnimationFrame(() => {
        this._heightAnim = content.animate(
          [{ height: `${from}px` }, { height: `0px` }],
          { duration: 350, easing: 'ease' }
        );

        this._heightAnim.onfinish = () => {
          content.style.height = '';
          content.style.display = 'none';
          content.style.overflow = '';
          content.style.willChange = '';
        };

        if (headerIcon) {
          this._iconAnim = headerIcon.animate(
            [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-90deg)' }],
            { duration: 350, easing: 'ease', fill: 'forwards' }
          );
        }
      });
    }
  }

  destroy() {
    super.destroy();
    this.wrapper.remove();
  }
}
