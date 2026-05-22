import icons from '../icons';
import type { LevaGUI } from './gui';

export function createHeader(title?: string, drag?: boolean) {
  const header = document.createElement('div');
  header.className = 'leva__header';
  const dropdown = document.createElement('div');
  dropdown.className = 'leva__icons leva__icons--dropdown-icon';
  dropdown.innerHTML = icons.downArrow;

  const grab = document.createElement('div');
  grab.className = 'leva__icons leva__icons--grab-icon';

  if (drag === false) {
    grab.classList.add('disabled');
  }

  if (title) {
    grab.textContent = title;
  } else if (drag !== false) {
    grab.innerHTML = icons.grab;
  }

  const search = document.createElement('div');
  search.className = 'leva__icons leva__icons--search-icon';
  search.innerHTML = icons.search;
  header.append(dropdown, grab, search);
  return header;
}

export function setupHeaderInteractivity(
  gui: LevaGUI,
  header: HTMLElement,
  drag: boolean
) {
  const { base, contentContainer, searchBar } = gui;

  const dropdownBtn = header.querySelector<HTMLElement>(
    '.leva__icons--dropdown-icon'
  )!;
  const grabBtn = header.querySelector<HTMLElement>('.leva__icons--grab-icon')!;
  const searchBtn = header.querySelector<HTMLElement>(
    '.leva__icons--search-icon'
  )!;
  const searchInput = searchBar.querySelector<HTMLInputElement>(
    '.leva__search-input'
  )!;
  const xBtn = searchBar.querySelector<HTMLElement>('#leva__search-x-button')!;

  let isSearchOpen = false;
  let searchAnim: Animation | undefined;
  let searchDebounceId: number | undefined;
  let startPos = { x: 0, y: 0 };

  const onMove = (ev: PointerEvent) => {
    if (!ev.isPrimary) return;
    base.style.transform = `translate3d(${ev.clientX - startPos.x}px, ${ev.clientY - startPos.y}px, 0)`;
  };

  const onUp = (upEv: PointerEvent) => {
    if (!upEv.isPrimary) return;
    grabBtn.style.cursor = 'grab';

    const rect = base.getBoundingClientRect();
    const parentRect = base.parentElement?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    const isFixed = window.getComputedStyle(base).position === 'fixed';

    if (isFixed) {
      base.style.left = `${rect.left}px`;
      base.style.top = `${rect.top}px`;
    } else {
      base.style.left = `${rect.left - parentRect.left}px`;
      base.style.top = `${rect.top - parentRect.top}px`;
    }

    base.style.transform = '';
    base.style.transition = '';
    base.style.width = '';

    try {
      grabBtn.releasePointerCapture(upEv.pointerId);
    } catch (err) {
      void err;
    }
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  };

  const onDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;

    const rect = base.getBoundingClientRect();
    const style = window.getComputedStyle(base);
    const parentRect = base.parentElement?.getBoundingClientRect() || {
      left: 0,
      top: 0,
    };
    const isFixed = style.position === 'fixed';

    startPos = { x: e.clientX, y: e.clientY };

    if (isFixed) {
      base.style.left = `${rect.left}px`;
      base.style.top = `${rect.top}px`;
    } else {
      base.style.left = `${rect.left - parentRect.left}px`;
      base.style.top = `${rect.top - parentRect.top}px`;
    }

    base.style.right = 'auto';
    base.style.bottom = 'auto';
    base.style.margin = '0';
    base.style.transition = 'none';
    base.style.transform = 'translate3d(0,0,0)';

    grabBtn.style.cursor = 'grabbing';
    try {
      grabBtn.setPointerCapture(e.pointerId);
    } catch (err) {
      void err;
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  if (drag !== false) {
    grabBtn.style.touchAction = 'none';
    grabBtn.style.cursor = 'grab';
    grabBtn.addEventListener('pointerdown', onDown);
  }

  // --- SEARCH & DROPDOWN ---
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
        rows.forEach((r) => r.container.classList.remove('search-hidden'));
        folders.forEach((f) => f.classList.remove('search-hidden'));
        gui.adjustHeight(true);
        xBtn.style.visibility = 'hidden';
        return;
      }

      folders.forEach((f) => f.classList.add('search-hidden'));

      rows.forEach((r) => {
        const isMatch = r.labelText.toLowerCase().includes(query);
        r.container.classList.toggle('search-hidden', !isMatch);

        if (isMatch) {
          let parent = r.container.parentElement;
          while (parent && parent !== gui.content) {
            if (parent.classList.contains('leva__folder')) {
              parent.classList.remove('search-hidden');
            }
            parent = parent.parentElement;
          }
        }
      });

      gui.adjustHeight(true);
      xBtn.style.visibility = 'visible';
    }, 120);
  };

  xBtn.onclick = () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'l') {
      e.preventDefault();
      if (isSearchOpen) {
        searchInput.focus();
        searchInput.select();
      } else {
        searchBtn.click();
      }
    }
  };

  document.addEventListener('keydown', onKeyDown);

  return () => {
    window.clearTimeout(searchDebounceId);
    document.removeEventListener('keydown', onKeyDown);
    grabBtn.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    dropdownBtn.onclick = null;
    searchBtn.onclick = null;
    xBtn.onclick = null;
    searchInput.oninput = null;
  };
}
