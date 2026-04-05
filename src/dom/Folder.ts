import GUIContainer from './GUIContainer';

export default class Folder extends GUIContainer {
  private wrapper: HTMLDivElement;
  private content: HTMLDivElement;
  private open = true;

  constructor(parent: HTMLElement, name: string) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('leva-folder');

    const header = document.createElement('div');
    header.classList.add('leva-folder-header');
    header.textContent = name;

    const content = document.createElement('div');
    content.classList.add('leva-folder-content');

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
    this.open = !this.open;
    this.content.style.display = this.open ? '' : 'none';
  }

  destroy() {
    super.destroy();
    this.wrapper.remove();
  }
}
