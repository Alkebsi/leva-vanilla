import '../styles/index.css';
import icons from '../icons';
import { createHeader, setupHeaderInteractivity, type LevaGUI } from './header';
import type { Controls } from './types';
import { createNumberInput } from './controls/number';
import { createBooleanInput } from './controls/boolean';
import { createSelectInput } from './controls/select';
import { createButtonInput } from './controls/button';
import type { AnyController } from '../core/types';

export function mountDOM(controls: Controls) {
  const elements = createGUIRoot();
  const _rowCache: LevaGUI['_rowCache'] = [];
  let _cacheRebuildId: number | undefined;
  let _heightAnim: Animation | undefined;

  const buildRowCache = () => {
    const nodes = Array.from(
      elements.content.querySelectorAll('.leva__row-container')
    ) as HTMLElement[];
    _rowCache.length = 0;
    nodes.forEach((container) => {
      const labelEl = container.querySelector(
        '.leva__label'
      ) as HTMLElement | null;
      _rowCache.push({
        container,
        labelEl,
        labelText: String(labelEl?.textContent || ''),
      });
    });
  };

  const adjustHeight = (animate = false) => {
    const prev = elements.contentContainer.clientHeight;
    if (getComputedStyle(elements.contentContainer).height === 'auto') {
      elements.contentContainer.style.height = `${prev}px`;
    }

    const next = (elements.contentContainer.firstElementChild as HTMLElement)
      .scrollHeight;
    if (prev === next) {
      elements.contentContainer.style.height = 'auto';
      return;
    }

    _heightAnim?.cancel();
    _heightAnim = elements.contentContainer.animate(
      [{ height: `${prev}px` }, { height: `${next}px` }],
      {
        duration: animate ? 350 : 0,
        easing: 'ease',
      }
    );

    _heightAnim.onfinish = () => {
      elements.contentContainer.style.height = 'auto';
    };
  };

  const gui: LevaGUI = { ...elements, _rowCache, buildRowCache, adjustHeight };

  renderControls(controls, gui.content);
  setupHeaderInteractivity(gui);

  const observer = new MutationObserver(() => {
    window.clearTimeout(_cacheRebuildId);
    _cacheRebuildId = window.setTimeout(buildRowCache, 50);
  });
  observer.observe(gui.content, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  buildRowCache();

  return gui;
}

export function createGUIRoot(parent: HTMLElement = document.body) {
  const root = document.createElement('div');
  root.id = 'leva__root';

  const base = document.createElement('div');
  base.className = 'leva__base leva__base--fill-false leva__base--flat-false';

  const header = createHeader();
  const content = document.createElement('div');
  content.className = 'leva__content';

  const searchBar = document.createElement('div');
  searchBar.className = 'leva__search';
  const searchInput = document.createElement('input');
  searchInput.placeholder = '[Open filter with CMD+SHIFT+L]';
  searchInput.name = 'leva__search-input';
  searchInput.id = 'leva__search-input';

  const xBtn = document.createElement('i');
  xBtn.innerHTML = icons.cross;
  xBtn.id = 'leva__search-x-button';
  searchBar.append(searchInput, xBtn);

  // Start collapsed
  searchBar.style.height = '0px';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'leva__content-container';
  contentContainer.append(content);

  requestAnimationFrame(() => {
    contentContainer.style.setProperty('height', 'auto');
  });

  base.append(header, searchBar, contentContainer);
  root.appendChild(base);
  parent.appendChild(root);

  return {
    root,
    base,
    header,
    searchBar,
    content,
    contentContainer,
  };
}

function renderControls(controls: Controls, container: HTMLElement) {
  const controllers = controls._controllers;

  Object.keys(controllers).forEach((key) => {
    const controller = controllers[key] as AnyController;
    switch (controller.type) {
      case 'number':
        container.appendChild(createNumberInput(key, controller));
        break;
      case 'boolean':
        container.appendChild(createBooleanInput(key, controller));
        break;
      case 'select':
        container.appendChild(createSelectInput(key, controller));
        break;
      case 'button':
        container.appendChild(createButtonInput(key, controller));
        break;
      default:
        console.warn(`[leva] No renderer found for key: ${key}`);
        break;
    }
  });
}
