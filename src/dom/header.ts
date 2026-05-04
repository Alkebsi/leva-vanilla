import icons from '../icons';
import type { createGUIRoot } from './gui';

export function createHeader() {
  const header = document.createElement('div');
  header.className = 'leva__header';

  const dropdown = document.createElement('div');
  dropdown.className = 'leva__icons leva__icons--dropdown-icon';
  dropdown.innerHTML = icons.downArrow;

  const grab = document.createElement('div');
  grab.className = 'leva__icons leva__icons--grab-icon';
  grab.innerHTML = icons.grab;

  const search = document.createElement('div');
  search.className = 'leva__icons leva__icons--search-icon';
  search.innerHTML = icons.search;

  header.appendChild(dropdown);
  header.appendChild(grab);
  header.appendChild(search);

  return header;
}

export function setupHeaderInteractivity(
  gui: ReturnType<typeof createGUIRoot>
) {
  const { base, header, contentContainer, content, searchBar } = gui; // Destructure all necessary elements
  const dropdownBtn = header.querySelector<HTMLElement>(
    '.leva__icons--dropdown-icon'
  )!;
  const grabBtn = header.querySelector<HTMLElement>('.leva__icons--grab-icon')!;
  const searchBtn = header.querySelector<HTMLElement>(
    '.leva__icons--search-icon'
  )!;
  const searchInput = searchBar.querySelector<HTMLInputElement>('input')!;

  [dropdownBtn, grabBtn, searchBtn].forEach((btn) =>
    btn.classList.add('leva__icons--active-true')
  );

  let isOpen = true;
  let isSearchOpen = false;

  let heightAnim: Animation | undefined;
  let searchAnim: Animation | undefined;

  grabBtn.style.touchAction = 'none';
  grabBtn.style.cursor = 'grab';
  grabBtn.addEventListener('pointerdown', (e: PointerEvent) => {
    if (!e.isPrimary) return;
    const rect = base.getBoundingClientRect();
    base.style.position = 'fixed';
    base.style.left = `${rect.left}px`;
    base.style.top = `${rect.top}px`;
    base.style.margin = '0';

    const startX = e.clientX,
      startY = e.clientY;
    const startLeft = rect.left,
      startTop = rect.top;
    const elWidth = rect.width,
      elHeight = rect.height;

    try {
      grabBtn.setPointerCapture(e.pointerId);
    } catch (err) {
      void err;
    }

    const onMove = (ev: PointerEvent) => {
      if (!ev.isPrimary) return;
      base.style.transform = `translate3d(${ev.clientX - startX}px, ${ev.clientY - startY}px, 0)`;
    };

    const onUp = (upEv: PointerEvent) => {
      if (!upEv.isPrimary) return;
      try {
        grabBtn.releasePointerCapture(upEv.pointerId);
      } catch (err) {
        void err;
      }
      const finalLeft = startLeft + (upEv.clientX - startX);
      const finalTop = startTop + (upEv.clientY - startY);
      base.style.transform = '';
      base.style.left = `${Math.min(Math.max(finalLeft, 0), window.innerWidth - elWidth)}px`;
      base.style.top = `${Math.min(Math.max(finalTop, 0), window.innerHeight - elHeight)}px`;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      grabBtn.style.cursor = 'grab';
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    grabBtn.style.cursor = 'grabbing';
  });

  dropdownBtn.onclick = () => {
    const iconElem = dropdownBtn.firstElementChild as HTMLElement;
    const currentHeight = contentContainer.getBoundingClientRect().height;
    const currentOpacity = parseFloat(window.getComputedStyle(content).opacity);

    const transform = window.getComputedStyle(iconElem).transform;
    let currentAngle = isOpen ? 0 : -90;
    if (transform && transform !== 'none') {
      const matrix = transform.split('(')[1].split(')')[0].split(',');
      currentAngle = Math.round(
        Math.atan2(parseFloat(matrix[1]), parseFloat(matrix[0])) *
          (180 / Math.PI)
      );
    }

    heightAnim?.cancel();

    if (isOpen) {
      contentContainer.style.overflow = 'hidden';
      heightAnim = contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: `0px` }],
        { duration: 350, easing: 'ease', fill: 'forwards' }
      );
      content.animate([{ opacity: currentOpacity }, { opacity: 0 }], {
        duration: 200,
        easing: 'ease-in',
        fill: 'forwards',
      });
      iconElem.animate(
        [
          { transform: `rotate(${currentAngle}deg)` },
          { transform: 'rotate(-90deg)' },
        ],
        { duration: 350, easing: 'ease', fill: 'forwards' }
      );
      heightAnim.onfinish = () => {
        contentContainer.style.height = '0px';
        contentContainer.style.overflow = '';
      };
      isOpen = false;
    } else {
      const toHeight = content.scrollHeight;
      contentContainer.style.overflow = 'hidden';
      heightAnim = contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
        { duration: 350, easing: 'ease', fill: 'forwards' }
      );
      content.animate([{ opacity: currentOpacity }, { opacity: 1 }], {
        duration: 200,
        delay: 200,
        easing: 'ease-out',
        fill: 'both',
      });
      iconElem.animate(
        [
          { transform: `rotate(${currentAngle}deg)` },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 350, easing: 'ease', fill: 'forwards' }
      );
      heightAnim.onfinish = () => {
        contentContainer.style.height = 'auto';
        contentContainer.style.overflow = '';
      };
      isOpen = true;
    }
  };

  searchBtn.onclick = () => {
    const currentHeight = searchBar.getBoundingClientRect().height;
    searchAnim?.cancel();

    const opening = !isSearchOpen;
    const to = opening ? 30 : 0;

    searchBar.style.overflow = 'hidden';
    searchAnim = searchBar.animate(
      [{ height: `${currentHeight}px` }, { height: `${to}px` }],
      { duration: 350, easing: 'ease', fill: 'forwards' }
    );

    // Toggle state immediately
    isSearchOpen = opening;

    if (opening) {
      searchInput.focus();
      searchInput.select();
    }

    searchAnim.onfinish = () => {
      searchBar.style.height = `${to}px`;
      searchBar.style.overflow = '';
    };
  };

  // Keyboard shortcut for search
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
