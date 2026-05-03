import '../styles/index.css';
import { createHeader } from './header';
import type { Controls } from './types';
import { createNumberInput } from './controls/number';
import { createBooleanInput } from './controls/boolean';
import { createSelectInput } from './controls/select';
import { createButtonInput } from './controls/button';
import type {
  NumberController,
  BooleanController,
  SelectController,
  ButtonController,
} from '../core/types';

export function mountDOM(controls: Controls) {
  const gui = createGUIRoot();

  renderControls(controls, gui.content);

  return gui;
}

export function createGUIRoot(parent: HTMLElement = document.body) {
  const root = document.createElement('div');
  root.id = 'leva__root';

  const base = document.createElement('div');
  base.className = 'leva__base';

  const header = createHeader();
  const content = document.createElement('div');
  content.className = 'leva__content';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'leva__content-container';
  contentContainer.append(content);

  base.appendChild(header);
  base.appendChild(contentContainer);
  root.appendChild(base);
  parent.appendChild(root);

  return {
    root,
    base,
    header,
    content,
  };
}

function renderControls(controls: Controls, container: HTMLElement) {
  const controllers = controls._controllers;

  for (const key in controllers) {
    const controller = controllers[key];

    if (controller.type === 'number') {
      container.appendChild(
        createNumberInput(key, controller as NumberController)
      );
    }

    if (controller.type === 'boolean') {
      container.appendChild(
        createBooleanInput(key, controller as BooleanController)
      );
    }

    if (controller.type === 'select') {
      container.appendChild(
        createSelectInput(key, controller as SelectController)
      );
    }

    if (controller.type === 'button') {
      container.appendChild(
        createButtonInput(key, controller as ButtonController)
      );
    }
  }
}
