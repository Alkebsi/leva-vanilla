import '../styles/index.css';
import icons from '../icons';
import GUIContainer from './GUIContainer';
import Folder from './Folder';

export default class GUI extends GUIContainer {
  protected folders: Folder[] = [];
  protected leva = document.createElement('div');

  private _contentContainer = document.createElement('div');

  private _heightAnim?: Animation;
  private _opacityAnim?: Animation;
  private _iconAnim?: Animation;
  private _searchAnim?: Animation;
  private _searchDebounce = 120;
  private _searchDebounceId?: number;
  private _rowCache: Array<{
    container: HTMLElement;
    labelEl: HTMLElement | null;
    labelText: string;
  }> = [];
  private _observer?: MutationObserver;
  private _cacheRebuildId?: number;
  private _cacheDebounce = 50;
  private _searchInput?: HTMLInputElement;

  private _dropdownBtn = document.createElement('div');
  private _grabIcon = document.createElement('div');
  private _searchBtn = document.createElement('div');
  private _search = document.createElement('div');
  private _isSearchOpen = false;

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
    this.leva.classList.add('leva__base--fill-false');
    this.leva.classList.add('leva__base--flat-false');
    this.leva.appendChild(this._contentContainer);
    // Let the content size itself naturally on mount
    requestAnimationFrame(() => {
      this._contentContainer.style.setProperty('height', 'auto');
    });

    root.appendChild(this.leva);

    parent.appendChild(root);
  }

  private _createSearchBar() {
    this._search.className = 'leva__search';

    const input = document.createElement('input');
    input.name = 'leva__search-input';
    input.id = 'leva__search-input';
    input.placeholder = '[Open filter with CMD+SHIFT+L]';
    this._searchInput = input;

    this._search.append(input);

    input.oninput = () => {
      window.clearTimeout(this._searchDebounceId);
      this._searchDebounceId = window.setTimeout(() => {
        const query = String(input.value || '')
          .trim()
          .toLowerCase();

        // Use cached rows for faster filtering
        const rows = this._rowCache;

        if (query === '') {
          rows.forEach((r) => (r.container.style.display = ''));

          const folders =
            this._contentContainer.querySelectorAll('.leva-folder');
          folders.forEach((f) => ((f as HTMLElement).style.display = ''));
          this._adjustContainerHeight(true);
          return;
        }

        rows.forEach((r) => {
          const text = (
            r.labelEl?.textContent ||
            r.labelText ||
            ''
          ).toLowerCase();
          const match = text.includes(query);
          r.container.style.display = match ? '' : 'none';
        });

        const folders = Array.from(
          this._contentContainer.querySelectorAll('.leva-folder')
        ) as HTMLElement[];

        folders.forEach((folder) => {
          const content = folder.querySelector('.leva-folder-content');
          if (!content) return;

          const hasVisibleRow = !!content.querySelector(
            '.leva__row-container:not([style*="display: none"])'
          );
          const hasVisibleFolder = !!content.querySelector(
            '.leva-folder:not([style*="display: none"])'
          );

          folder.style.display =
            hasVisibleRow || hasVisibleFolder ? '' : 'none';
        });

        this._adjustContainerHeight(true);
      }, this._searchDebounce);
    };

    this.leva.appendChild(this._search);
  }

  private _createHeader() {
    const header = document.createElement('div');
    header.className = 'leva__header';
    header.classList.add('leva__header--mode-grab'); // TODO: manage modes later

    // Dropdown
    this._dropdownBtn.className = 'leva__icons';
    this._dropdownBtn.classList.add('leva__icons--dropdown-icon');
    this._dropdownBtn.classList.add('leva__icons--active-true');
    this._dropdownBtn.innerHTML = icons.downArrow;
    header.appendChild(this._dropdownBtn);

    // Grab
    this._grabIcon.className = 'leva__icons';
    this._grabIcon.classList.add('leva__icons--grab-icon');
    this._grabIcon.classList.add('leva__icons--active-true');
    this._grabIcon.innerHTML = icons.grab;
    header.appendChild(this._grabIcon);

    // Search
    this._searchBtn.className = 'leva__icons';
    this._searchBtn.classList.add('leva__icons--search-icon');
    this._searchBtn.classList.add('leva__icons--active-true');
    this._searchBtn.innerHTML = icons.search;
    header.appendChild(this._searchBtn);

    this.leva.appendChild(header);
    this._headerInteractivity();
    // build initial cache and observe changes to keep it up to date
    this._buildRowCache();
    this._observer = new MutationObserver(() => {
      window.clearTimeout(this._cacheRebuildId);
      this._cacheRebuildId = window.setTimeout(
        () => this._buildRowCache(),
        this._cacheDebounce
      );
    });
    this._observer.observe(this.container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // keyboard shortcut
    document.addEventListener('keydown', (e) => {
      const key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'l') {
        e.preventDefault();
        this._openSearchAndFocus();
      }
    });
  }

  private _openSearchAndFocus() {
    if (!this._isSearchOpen) this._searchBtn.click();
    // focus the input on next frame after open animation
    requestAnimationFrame(() => {
      this._searchInput?.focus();
      (this._searchInput as HTMLInputElement)?.select?.();
    });
  }

  private _headerInteractivity() {
    const toggleContentState = () => {
      const contentElem = this._contentContainer
        .firstElementChild as HTMLElement;

      const animateToOpen = () => {
        // cancel previous animations
        this._heightAnim?.cancel();
        this._opacityAnim?.cancel();
        this._iconAnim?.cancel();

        const from = this._contentContainer.clientHeight || 0;
        const to = contentElem.scrollHeight;

        this._contentContainer.style.overflow = 'hidden';

        this._heightAnim = this._contentContainer.animate(
          [{ height: `${from}px` }, { height: `${to}px` }],
          { duration: 220, easing: 'ease' }
        );

        this._opacityAnim = contentElem.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 220, easing: 'linear' }
        );

        this._iconAnim = (
          this._dropdownBtn.firstElementChild as HTMLElement
        ).animate(
          [{ transform: 'rotate(-90deg)' }, { transform: 'rotate(0deg)' }],
          { duration: 220, easing: 'ease', fill: 'forwards' }
        );

        this._heightAnim.onfinish = () => {
          this._contentContainer.style.height = 'auto';
          this._contentContainer.style.overflow = '';
        };

        this.isOpen = true;
      };

      const animateToClose = () => {
        this._heightAnim?.cancel();
        this._opacityAnim?.cancel();
        this._iconAnim?.cancel();

        const from =
          this._contentContainer.clientHeight || contentElem.scrollHeight;
        const to = 0;

        this._contentContainer.style.overflow = 'hidden';

        this._heightAnim = this._contentContainer.animate(
          [{ height: `${from}px` }, { height: `${to}px` }],
          { duration: 200, easing: 'ease' }
        );

        this._opacityAnim = contentElem.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 160, easing: 'linear' }
        );

        this._iconAnim = (
          this._dropdownBtn.firstElementChild as HTMLElement
        ).animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-90deg)' }],
          { duration: 200, easing: 'ease', fill: 'forwards' }
        );

        this._heightAnim.onfinish = () => {
          this._contentContainer.style.height = '0px';
          this._contentContainer.style.overflow = '';
        };

        this.isOpen = false;
      };

      if (this.isOpen) animateToClose();
      else animateToOpen();
    };

    this._dropdownBtn.onclick = () => {
      toggleContentState();
    };

    this._searchBtn.onclick = () => {
      this._searchAnim?.cancel();
      const from = this._search.clientHeight || 0;
      const to = this._isSearchOpen ? 0 : 30;

      this._search.style.overflow = 'hidden';
      this._searchAnim = this._search.animate(
        [{ height: `${from}px` }, { height: `${to}px` }],
        { duration: 160, easing: 'ease' }
      );

      this._searchAnim.onfinish = () => {
        this._search.style.height = `${to}px`;
        this._search.style.overflow = '';
      };

      this._isSearchOpen = !this._isSearchOpen;
    };
  }

  // Adjust the main content container height to match internal content
  private _adjustContainerHeight(animate = false) {
    if (!this.isOpen) return;

    const contentElem = this._contentContainer.firstElementChild as HTMLElement;
    if (!contentElem) return;

    const prev = this._contentContainer.clientHeight || 0;
    // Force a concrete start height if currently 'auto'
    if (getComputedStyle(this._contentContainer).height === 'auto') {
      this._contentContainer.style.height = `${prev}px`;
    }

    const next = contentElem.scrollHeight;
    if (prev === next) {
      this._contentContainer.style.height = 'auto';
      return;
    }

    this._heightAnim?.cancel();
    this._heightAnim = this._contentContainer.animate(
      [{ height: `${prev}px` }, { height: `${next}px` }],
      { duration: animate ? 180 : 0, easing: 'ease' }
    );

    this._heightAnim.onfinish = () => {
      this._contentContainer.style.height = 'auto';
    };
  }

  private _buildRowCache() {
    const nodes = Array.from(
      this.container.querySelectorAll('.leva__row-container')
    ) as HTMLElement[];
    this._rowCache = nodes.map((container) => {
      const labelEl = container.querySelector(
        '.leva__label'
      ) as HTMLElement | null;
      return {
        container,
        labelEl,
        labelText: String(labelEl?.textContent || ''),
      };
    });
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }
}
