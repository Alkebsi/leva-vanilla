import icons from '../icons';
import type { LevaGUI } from './gui';

export function createHeader(title?: string) {
  const header = document.createElement('div');
  header.className = 'leva__header';
  const titleEl = document.createElement('div');
  titleEl.className = 'leva__title';
  titleEl.textContent = title || '';
  const dropdown = document.createElement('div');
  dropdown.className = 'leva__icons leva__icons--dropdown-icon';
  dropdown.innerHTML = icons.downArrow;

  const grab = document.createElement('div');
  grab.className = 'leva__icons leva__icons--grab-icon';
  grab.innerHTML = icons.grab;
  const search = document.createElement('div');
  search.className = 'leva__icons leva__icons--search-icon';
  search.innerHTML = icons.search;
  header.append(dropdown, titleEl, grab, search);
  return header;
}

export function setupHeaderInteractivity(gui: LevaGUI) {
  const { base, header, contentContainer, searchBar } = gui;
  const dropdownBtn = header.querySelector<HTMLElement>(
    '.leva__icons--dropdown-icon'
  )!;
  const grabBtn = header.querySelector<HTMLElement>('.leva__icons--grab-icon')!;
  const searchBtn = header.querySelector<HTMLElement>(
    '.leva__icons--search-icon'
  )!;
  const searchInput = searchBar.querySelector<HTMLInputElement>(
    '#leva__search-input'
  )!;
  const xBtn = searchBar.querySelector<HTMLElement>('#leva__search-x-button')!;

  let isSearchOpen = false;
  let searchAnim: Animation | undefined;
  let searchDebounceId: number | undefined;
  grabBtn.style.touchAction = 'none';
  grabBtn.style.cursor = 'grab';
  grabBtn.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!e.isPrimary) return;
    const rect = base.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const {
      left: startLeft,
      top: startTop,
      width: elWidth,
      height: elHeight,
    } = rect;

    let isDragging = true;
    base.style.position = 'fixed';
    base.style.left = `${startLeft}px`;
    base.style.top = `${startTop}px`;
    base.style.width = `${elWidth}px`;
    base.style.right = 'auto';
    base.style.bottom = 'auto';
    base.style.margin = '0';
    base.style.setProperty('transition', 'none', 'important');

    try {
      grabBtn.setPointerCapture(e.pointerId);
    } catch (err) {
      void err;
    }

    let currentDx = 0;
    let currentDy = 0;
    let ticking = false;

    const onMove = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;
      currentDx = ev.clientX - startX;
      currentDy = ev.clientY - startY;

      if (!ticking) {
        requestAnimationFrame(() => {
          if (!isDragging) return;
          base.style.transform = `translate3d(${currentDx}px, ${currentDy}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    const onUp = (upEv: PointerEvent) => {
      if (!upEv.isPrimary) return;
      isDragging = false;

      try {
        grabBtn.releasePointerCapture(upEv.pointerId);
      } catch (err) {
        void err;
      }

      const dx = upEv.clientX - startX;
      const dy = upEv.clientY - startY;
      base.style.transform = '';
      base.style.transition = '';
      base.style.left = `${Math.min(Math.max(startLeft + dx, 0), window.innerWidth - elWidth)}px`;
      base.style.top = `${Math.min(Math.max(startTop + dy, 0), window.innerHeight - elHeight)}px`;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      grabBtn.style.cursor = 'grab';
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    grabBtn.style.cursor = 'grabbing';
  });
  dropdownBtn.onclick = () => gui.toggle();
  searchBtn.onclick = () => {
    const opening = !isSearchOpen;
    const toHeight = opening ? 30 : 0;
    const currentHeight = searchBar.getBoundingClientRect().height;
    searchAnim?.cancel();
    searchBar.style.overflow = 'hidden';
    searchAnim = searchBar.animate(
      [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
      { duration: 350, easing: 'ease', fill: 'forwards' }
    );
    isSearchOpen = opening;
    if (opening) {
      searchInput.focus();
      searchInput.select();
    } else {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
    searchAnim.onfinish = () => {
      searchBar.style.height = `${toHeight}px`;
      searchBar.style.overflow = '';
    };
  };
  searchInput.oninput = () => {
    window.clearTimeout(searchDebounceId);
    searchDebounceId = window.setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();
      const rows = gui._rowCache;
      const folders = Array.from(
        contentContainer.querySelectorAll<HTMLElement>('.leva__folder')
      );

      if (query === '') {
        rows.forEach((r) => (r.container.style.display = ''));
        folders.forEach((f) => (f.style.display = ''));
        gui.adjustHeight(true);
        xBtn.style.visibility = 'hidden';
        return;
      }

      folders.forEach((f) => (f.style.display = 'none'));
      rows.forEach((r) => {
        const isMatch = r.labelText.toLowerCase().includes(query);
        if (isMatch) {
          r.container.style.display = '';
          let parent = r.container.parentElement;
          while (parent && parent !== gui.content) {
            if (parent.classList.contains('leva__folder')) {
              parent.style.display = '';
            }
            parent = parent.parentElement;
          }
        } else {
          r.container.style.display = 'none';
        }
      });

      if (gui.isOpen()) gui.adjustHeight(true);
      xBtn.style.visibility = 'visible';
    }, 120);
  };
  xBtn.onclick = () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  };
  document.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'l') {
      e.preventDefault();
      if (!isSearchOpen) {
        searchBtn.click();
      } else {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
}
