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
  private _grabBtn = document.createElement('div');
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
    requestAnimationFrame(() => {
      this._contentContainer.style.setProperty('height', 'auto');
    });

    root.appendChild(this.leva);

    parent.appendChild(root);
    this._manageDrag();
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

  private _manageDrag() {
    const grab = this._grabBtn;

    grab.style.touchAction = 'none';
    grab.style.cursor = 'grab';

    grab.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.isPrimary === false) return;
      e.preventDefault();

      const root = this.leva;
      if (!root) return;

      const rect = root.getBoundingClientRect();

      root.style.position = 'fixed';
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.margin = '0';

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const elWidth = rect.width;
      const elHeight = rect.height;

      try {
        grab.setPointerCapture(e.pointerId);
      } catch (err) {
        void err;
      }

      let pendingDx = 0;
      let pendingDy = 0;
      let rafId: number | null = null;

      const applyTransform = () => {
        rafId = null;
        root.style.transform = `translate3d(${pendingDx}px, ${pendingDy}px, 0)`;
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.isPrimary === false) return;
        pendingDx = ev.clientX - startX;
        pendingDy = ev.clientY - startY;
        if (rafId == null) rafId = requestAnimationFrame(applyTransform);
      };

      const onUp = (upEv: PointerEvent) => {
        if (upEv.isPrimary === false) return;
        try {
          grab.releasePointerCapture(upEv.pointerId);
        } catch (err) {
          void err;
        }

        if (rafId != null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        // compute final position and commit
        const finalLeft = Math.round(startLeft + pendingDx);
        const finalTop = Math.round(startTop + pendingDy);

        const maxLeft = Math.max(window.innerWidth - elWidth, 0);
        const maxTop = Math.max(window.innerHeight - elHeight, 0);

        root.style.transform = '';
        root.style.left = `${Math.min(Math.max(finalLeft, 0), maxLeft)}px`;
        root.style.top = `${Math.min(Math.max(finalTop, 0), maxTop)}px`;
        grab.style.cursor = 'grab';

        document.removeEventListener('pointermove', onMove as EventListener);
        document.removeEventListener('pointerup', onUp as EventListener);
      };

      document.addEventListener('pointermove', onMove as EventListener);
      document.addEventListener('pointerup', onUp as EventListener);
      grab.style.cursor = 'grabbing';
    });
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
    this._grabBtn.className = 'leva__icons';
    this._grabBtn.classList.add('leva__icons--grab-icon');
    this._grabBtn.classList.add('leva__icons--active-true');
    this._grabBtn.innerHTML = icons.grab;
    header.appendChild(this._grabBtn);

    // Search
    this._searchBtn.className = 'leva__icons';
    this._searchBtn.classList.add('leva__icons--search-icon');
    this._searchBtn.classList.add('leva__icons--active-true');
    this._searchBtn.innerHTML = icons.search;
    header.appendChild(this._searchBtn);

    this.leva.appendChild(header);
    this._headerInteractivity();
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
    requestAnimationFrame(() => {
      this._searchInput?.focus();
      (this._searchInput as HTMLInputElement)?.select?.();
    });
  }

  private _toggleContentState = (closeOnly?: boolean) => {
    const contentElem = this._contentContainer.firstElementChild as HTMLElement;
    const iconElem = this._dropdownBtn.firstElementChild as HTMLElement;

    const currentHeight = this._contentContainer.getBoundingClientRect().height;
    const currentOpacity = window.getComputedStyle(contentElem).opacity;

    const transform = window.getComputedStyle(iconElem).transform;
    let currentAngle = this.isOpen ? 0 : -90;
    if (transform && transform !== 'none') {
      const matrix = transform.split('(')[1].split(')')[0].split(',');
      currentAngle = Math.round(
        Math.atan2(parseFloat(matrix[1]), parseFloat(matrix[0])) *
          (180 / Math.PI)
      );
    }

    this._heightAnim?.cancel();
    this._opacityAnim?.cancel();
    this._iconAnim?.cancel();

    const animateToOpen = () => {
      const toHeight = contentElem.scrollHeight;

      this._contentContainer.style.overflow = 'hidden';

      this._heightAnim = this._contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      this._opacityAnim = contentElem.animate(
        [{ opacity: currentOpacity }, { opacity: 1 }],
        {
          duration: closeOnly ? 0 : 350,
          delay: 200,
          easing: 'ease-out',
          fill: 'both',
        }
      );

      this._iconAnim = iconElem.animate(
        [
          { transform: `rotate(${currentAngle}deg)` },
          { transform: 'rotate(0deg)' },
        ],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      this._heightAnim.onfinish = () => {
        this._contentContainer.style.height = 'auto';
        this._contentContainer.style.overflow = '';
        this._heightAnim?.cancel();
      };

      this.isOpen = true;
    };

    const animateToClose = () => {
      const toHeight = 0;

      this._contentContainer.style.overflow = 'hidden';

      this._heightAnim = this._contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
        {
          duration: closeOnly ? 0.1 : 350,
          easing: 'ease',
          fill: 'forwards',
        }
      );

      this._opacityAnim = contentElem.animate(
        [{ opacity: currentOpacity }, { opacity: 0 }],
        {
          duration: closeOnly ? 0 : 250,
          delay: 0,
          easing: 'ease-in',
          fill: 'forwards',
        }
      );

      this._iconAnim = iconElem.animate(
        [
          { transform: `rotate(${currentAngle}deg)` },
          { transform: 'rotate(-90deg)' },
        ],
        { duration: closeOnly ? 0 : 350, easing: 'ease', fill: 'forwards' }
      );

      this._heightAnim.onfinish = () => {
        this._contentContainer.style.height = '0px';
        this._contentContainer.style.overflow = '';
        this._heightAnim?.cancel();
      };

      this.isOpen = false;
    };

    if (!closeOnly) {
      if (this.isOpen) animateToClose();
      else animateToOpen();
    } else {
      animateToClose();
    }
  };

  private _headerInteractivity() {
    this._dropdownBtn.onclick = () => {
      this._toggleContentState();
    };

    this._searchBtn.onclick = () => {
      const currentHeight = this._search.getBoundingClientRect().height;
      this._searchAnim?.cancel();

      const to = this._isSearchOpen ? 0 : 30;

      this._search.style.overflow = 'hidden';
      this._searchAnim = this._search.animate(
        [{ height: `${currentHeight}px` }, { height: `${to}px` }],
        {
          duration: 350,
          easing: 'ease',
          fill: 'forwards',
        }
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
      { duration: animate ? 350 : 0, easing: 'ease' }
    );

    this._heightAnim.onfinish = () => {
      this._contentContainer.style.height = 'auto';
      this._heightAnim?.cancel();
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

  close() {
    this._toggleContentState(true);
  }

  addFolder(name: string) {
    return new Folder(this.container, name);
  }
}
