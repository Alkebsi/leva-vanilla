import '../styles/index.css';
import icons from '../icons';
import GUIContainer from './GUIContainer';
import Folder from './Folder';

export default class GUI extends GUIContainer {
  protected folders: Folder[] = [];
  protected leva = document.createElement('div');

  private _contentContainer = document.createElement('div');
  private _containerClientHeight = 0;

  private _dropdown = document.createElement('div');
  private _grabIcon = document.createElement('div');
  private _searchIcon = document.createElement('div');

  constructor(parent: HTMLElement = document.body) {
    const root = document.createElement('div');
    root.id = 'leva__root';

    const content = document.createElement('div');
    content.className = 'leva__content';

    super(content);
    this._contentContainer.className = 'leva__content-container';
    this._contentContainer.appendChild(content);

    this._createHeader();
    this._createSearchBar();

    this.leva.className = 'leva__base';
    this.leva.classList.add('leva__base--fill-false'); // TODO: manage modes later
    this.leva.classList.add('leva__base--flat-false'); // TODO: manage modes later
    this.leva.appendChild(this._contentContainer);
    requestAnimationFrame(() => {
      this._containerClientHeight = content.clientHeight;
      this._contentContainer.style.setProperty(
        'height',
        `${this._containerClientHeight}px`
      );
    });

    root.appendChild(this.leva);

    parent.appendChild(root);
  }

  private _createSearchBar() {
    const search = document.createElement('div');
    search.className = 'leva__search';

    this.leva.appendChild(search);
  }

  private _createHeader() {
    const header = document.createElement('div');
    header.className = 'leva__header';
    header.classList.add('leva__header--mode-grab'); // TODO: manage modes later

    // Dropdown
    this._dropdown.className = 'leva__icons';
    this._dropdown.classList.add('leva__icons--dropdown-icon');
    this._dropdown.classList.add('leva__icons--active-true');
    this._dropdown.innerHTML = icons.downArrow;
    header.appendChild(this._dropdown);

    // Grab
    this._grabIcon.className = 'leva__icons';
    this._grabIcon.classList.add('leva__icons--grab-icon');
    this._grabIcon.classList.add('leva__icons--active-true');
    this._grabIcon.innerHTML = icons.grab;
    header.appendChild(this._grabIcon);

    // Search
    this._searchIcon.className = 'leva__icons';
    this._searchIcon.classList.add('leva__icons--search-icon');
    this._searchIcon.classList.add('leva__icons--active-true');
    this._searchIcon.innerHTML = icons.search;
    header.appendChild(this._searchIcon);

    this.leva.appendChild(header);
    this._headerInteractivity();
  }

  // TODO, Use Web Animation API instead of raw css animations
  private _headerInteractivity() {
    const toggleContentState = () => {
      if (this.isOpen) {
        (this._dropdown.firstElementChild as HTMLElement).style.setProperty(
          'transform',
          'rotate(-90deg)'
        );

        this._contentContainer.style.setProperty('height', '0px');
        (
          this._contentContainer.firstElementChild as HTMLElement
        ).style.setProperty('opacity', '0');

        this.isOpen = false;
      } else {
        (this._dropdown.firstElementChild as HTMLElement).style.setProperty(
          'transform',
          'rotate(0deg)'
        );

        this._contentContainer.style.setProperty(
          'height',
          `${this._containerClientHeight}px`
        );
        setTimeout(() => {
          (
            this._contentContainer.firstElementChild as HTMLElement
          ).style.setProperty('opacity', '1');
        }, 200);

        this.isOpen = true;
      }
    };

    this._dropdown.onclick = () => {
      toggleContentState();
    };
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }
}
