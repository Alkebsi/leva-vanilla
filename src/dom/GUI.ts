import '../styles/index.css';
import icons from '../icons';
import GUIContainer from './GUIContainer';
import Folder from './Folder';

export default class GUI extends GUIContainer {
  protected folders: Folder[] = [];
  protected leva = document.createElement('div');

  constructor(parent: HTMLElement = document.body) {
    const root = document.createElement('div');
    root.id = 'leva__root';

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('leva__content-container');

    const content = document.createElement('div');
    content.classList.add('leva__content');

    contentContainer.appendChild(content);

    super(content);

    this._createHeader();
    this._createSearchBar();

    this.leva.classList.add('leva__base');
    this.leva.classList.toggle('leva__base--fill-false'); // TODO: manage modes later
    this.leva.classList.toggle('leva__base--flat-false'); // TODO: manage modes later
    this.leva.appendChild(contentContainer);

    root.appendChild(this.leva);

    parent.appendChild(root);
  }

  private _createSearchBar() {
    const search = document.createElement('div');
    search.classList.add('leva__search');

    this.leva.appendChild(search);
  }

  private _createHeader() {
    const header = document.createElement('div');
    header.classList.add('leva__header');
    header.classList.toggle('leva__header--mode-grab'); // TODO: manage modes later

    // icons
    const dropdownIcon = document.createElement('div');
    dropdownIcon.classList.add('leva__icons');
    dropdownIcon.classList.toggle('leva__icons--dropdown-icon');
    dropdownIcon.classList.toggle('leva__icons--active-true');
    dropdownIcon.innerHTML = icons.downArrow;
    header.appendChild(dropdownIcon);

    const grabIcon = document.createElement('div');
    grabIcon.classList.add('leva__icons');
    grabIcon.classList.toggle('leva__icons--grab-icon');
    grabIcon.classList.toggle('leva__icons--active-true');
    grabIcon.innerHTML = icons.grab;
    header.appendChild(grabIcon);

    const searchIcon = document.createElement('div');
    searchIcon.classList.add('leva__icons');
    searchIcon.classList.toggle('leva__icons--search-icon');
    searchIcon.classList.toggle('leva__icons--active-true');
    searchIcon.innerHTML = icons.search;
    header.appendChild(searchIcon);

    this.leva.appendChild(header);
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }
}
