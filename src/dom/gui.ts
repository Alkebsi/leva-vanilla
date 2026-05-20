import '../styles/index.css';
import icons from '../icons';
import { createHeader, setupHeaderInteractivity } from './header';
import type { Controls } from './types';
import { createNumberInput } from './controls/number';
import { createStringInput } from './controls/string';
import { createBooleanInput } from './controls/boolean';
import { createSelectInput } from './controls/select';
import { createColorInput } from './controls/color';
import { createButtonInput } from './controls/button';
import type { AnyController } from '../core/types';
import { createFolder } from './folder';
import type { Node } from '../schema/nodes';

const CONTROL_RENDERERS: Record<
  string,
  (name: string, ctrl: AnyController) => HTMLElement
> = {
  string: createStringInput as (
    name: string,
    ctrl: AnyController
  ) => HTMLElement,
  color: createColorInput as (name: string, ctrl: AnyController) => HTMLElement,
  number: createNumberInput as (
    name: string,
    ctrl: AnyController
  ) => HTMLElement,
  boolean: createBooleanInput as (
    name: string,
    ctrl: AnyController
  ) => HTMLElement,
  select: createSelectInput as (
    name: string,
    ctrl: AnyController
  ) => HTMLElement,
  button: createButtonInput as (
    name: string,
    ctrl: AnyController
  ) => HTMLElement,
};

export type LevaGUI = ReturnType<typeof createGUIRoot> & {
  _rowCache: Array<{
    container: HTMLElement;
    labelEl: HTMLElement | null;
    labelText: string;
  }>;
  buildRowCache: () => void;
  adjustHeight: (animate?: boolean) => void;
  toggle: (open?: boolean) => void;
  isOpen: () => boolean;
  dispose: () => void;
};

const panelRegistry = new Map<string, LevaGUI>();

export function mountDOM(
  controls: Controls,
  options: { title?: string; collapsed?: boolean; panel?: string } = {}
) {
  const panelId = options.panel || 'default';
  let gui = panelRegistry.get(panelId);

  if (gui) {
    renderControls(controls, gui.content);
    return gui;
  }

  const elements = createGUIRoot(
    document.body,
    options.title || (panelId === 'default' ? 'Leva' : panelId)
  );
  const _rowCache: LevaGUI['_rowCache'] = [];
  let _cacheRebuildId: number | undefined;
  let _heightAnim: Animation | undefined;
  let _contentAnim: Animation | undefined;
  let _iconAnim: Animation | undefined;
  let _isOpen = options.collapsed !== true;
  let _currentAngle = _isOpen ? 0 : -90;

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
    if (!_isOpen) return;

    const prev = elements.contentContainer.clientHeight || 0;
    const style = getComputedStyle(elements.contentContainer);
    if (style.height === 'auto' || style.height === '') {
      elements.contentContainer.style.height = `${prev}px`;
    }

    const next = elements.content.scrollHeight;
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
      _heightAnim?.cancel();
    };
  };

  const toggle = (open?: boolean) => {
    const wasOpen = _isOpen;
    const next = open ?? !wasOpen;
    if (next === wasOpen && open === undefined) return;
    _isOpen = next;

    const { contentContainer, content, header } = elements;
    const iconElem = header.querySelector('.leva__icons--dropdown-icon')
      ?.firstElementChild as HTMLElement;

    const currentHeight = contentContainer.getBoundingClientRect().height;
    const currentOpacity = window.getComputedStyle(content).opacity;
    const startAngle = _currentAngle;

    _heightAnim?.cancel();
    _contentAnim?.cancel();
    _iconAnim?.cancel();

    const animate = open === undefined;
    const duration = animate ? 350 : 0;
    contentContainer.style.overflow = 'hidden';

    _currentAngle = _isOpen ? 0 : -90;
    if (_isOpen) {
      const toHeight = content.scrollHeight;

      _heightAnim = contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: `${toHeight}px` }],
        { duration, easing: 'ease', fill: 'forwards' }
      );

      _contentAnim = content.animate(
        [{ opacity: currentOpacity }, { opacity: 1 }],
        {
          duration: duration * 0.57,
          delay: duration * 0.57,
          easing: 'ease-out',
          fill: 'both',
        }
      );

      _iconAnim = iconElem?.animate(
        [
          { transform: `rotate(${startAngle}deg)` },
          { transform: 'rotate(0deg)' },
        ],
        { duration, easing: 'ease', fill: 'forwards' }
      );

      _heightAnim.onfinish = () => {
        contentContainer.style.height = 'auto';
        contentContainer.style.overflow = '';
        _heightAnim?.cancel();
      };
    } else {
      _heightAnim = contentContainer.animate(
        [{ height: `${currentHeight}px` }, { height: '0px' }],
        { duration, easing: 'ease', fill: 'forwards' }
      );

      _contentAnim = content.animate(
        [{ opacity: currentOpacity }, { opacity: 0 }],
        { duration: duration * 0.57, easing: 'ease-in', fill: 'forwards' }
      );

      _iconAnim = iconElem?.animate(
        [
          { transform: `rotate(${startAngle}deg)` },
          { transform: 'rotate(-90deg)' },
        ],
        { duration, easing: 'ease', fill: 'forwards' }
      );

      _heightAnim.onfinish = () => {
        contentContainer.style.height = '0px';
        contentContainer.style.overflow = '';
        _heightAnim?.cancel();
      };
    }
  };

  const disposables: Array<() => void> = [];

  const dispose = () => {
    window.clearTimeout(_cacheRebuildId);
    observer.disconnect();

    _heightAnim?.cancel();
    _contentAnim?.cancel();
    _iconAnim?.cancel();

    disposables.forEach((fn) => fn());
    elements.root.remove();
    panelRegistry.delete(panelId);

    gui = undefined;
  };

  gui = {
    ...elements,
    _rowCache,
    buildRowCache,
    adjustHeight,
    toggle,
    isOpen: () => _isOpen,
    dispose,
  };

  panelRegistry.set(panelId, gui);
  renderControls(controls, gui.content);
  const cleanupInteractivity = setupHeaderInteractivity(gui);
  if (cleanupInteractivity) disposables.push(cleanupInteractivity);

  if (!_isOpen) {
    elements.contentContainer.style.height = '0px';
    elements.content.style.opacity = '0';
    const icon = elements.header.querySelector('.leva__icons--dropdown-icon')
      ?.firstElementChild as HTMLElement;
    if (icon) icon.style.transform = 'rotate(-90deg)';
  }

  const observer = new MutationObserver((mutations) => {
    const hasStructureChange = mutations.some((m) => m.type === 'childList');
    if (hasStructureChange) {
      window.clearTimeout(_cacheRebuildId);
      _cacheRebuildId = window.setTimeout(() => {
        buildRowCache();
        adjustHeight(true);
      }, 50);
    }
  });
  observer.observe(gui.content, {
    childList: true,
  });
  buildRowCache();

  return gui;
}

export function createGUIRoot(
  parent: HTMLElement = document.body,
  title?: string
) {
  const root = document.createElement('div');
  root.id = 'leva__root';

  const base = document.createElement('div');
  base.className = 'leva__base leva__base--fill-false leva__base--flat-false';

  const header = createHeader(title);
  const content = document.createElement('div');
  content.className = 'leva__content';

  const searchBar = document.createElement('div');
  searchBar.className = 'leva__search';
  const searchInput = document.createElement('input');
  searchInput.placeholder = '[Open filter with CMD+SHIFT+L]';
  searchInput.name = 'leva__search-input';
  searchInput.className = 'leva__search-input';

  const xBtn = document.createElement('i');
  xBtn.innerHTML = icons.cross;
  xBtn.id = 'leva__search-x-button';
  searchBar.append(searchInput, xBtn);

  searchBar.style.height = '0px';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'leva__content-container';
  contentContainer.append(content);

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
  _renderControlsRecursive(controls._tree, controllers, container, []);
}

function _renderControlsRecursive(
  tree: Record<string, Node>,
  controllers: Record<string, AnyController>,
  container: HTMLElement,
  path: string[]
) {
  for (const key in tree) {
    const node = tree[key];
    const fullPath = [...path, key].join('.');

    if (node.type === 'folder') {
      const folderElements = createFolder(container, key, {
        label: node.label,
        collapsed: node.collapsed,
        visible: node.visible,
      });

      _renderControlsRecursive(
        node.children,
        controllers,
        folderElements.content,
        [...path, key]
      );
    } else {
      const controller = controllers[fullPath];
      const renderer = controller ? CONTROL_RENDERERS[controller.type] : null;

      if (renderer && controller) {
        const controlEl = renderer(key, controller);
        container.appendChild(controlEl);

        controller.onDispose(() => {
          controlEl.remove();
        });
      } else {
        console.warn(
          `[leva] No renderer or controller found for type: ${controller?.type || 'unknown'} at ${fullPath}`
        );
      }
    }
  }
}
