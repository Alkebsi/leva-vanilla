import type { SelectController } from '../../core/types';
import icons from '../../icons';
import { generateId } from '../../utils/generateId';
import { createRow } from './row';

type Entry = {
  label: string;
  value: string | number;
};

export function createSelectInput(key: string, controller: SelectController) {
  const { container, control, label } = createRow(() => controller.value);

  const elementId = generateId(`leva__${key}`);

  label.htmlFor = elementId;
  label.textContent = controller.label;

  // Trigger
  const trigger = document.createElement('button');
  trigger.className = 'leva__input leva__input--select-trigger';
  trigger.type = 'button';
  trigger.id = elementId;

  // Dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'leva__select-dropdown';
  dropdown.hidden = true;

  // Icon
  const icon = document.createElement('div');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = icons.downArrow;

  control.append(trigger, icon);
  document.querySelector('#leva__root')?.appendChild(dropdown);
  control.classList.add('leva__control--select-parent');

  const entries: Entry[] = controller.options;
  let isOpen = false;

  /* ---------------------------------- */
  /* State                              */
  /* ---------------------------------- */

  const open = () => {
    positionDropdown();
    dropdown.hidden = false;
    isOpen = true;
  };

  const close = () => {
    dropdown.hidden = true;
    isOpen = false;
  };

  const toggle = () => (isOpen ? close() : open());

  /* ---------------------------------- */
  /* Positioning                        */
  /* ---------------------------------- */

  const positionDropdown = () => {
    const rect = trigger.getBoundingClientRect();

    dropdown.hidden = false;
    const height = dropdown.offsetHeight;
    dropdown.hidden = true;

    const width = rect.width;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + 4;
    let left = rect.left;

    if (rect.bottom + height > vh) {
      top = rect.top - height - 4;
    }

    if (left + width > vw) {
      left = vw - width - 8;
    }

    if (left < 8) left = 8;

    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.width = `${width}px`;
  };

  /* ---------------------------------- */
  /* Rendering                          */
  /* ---------------------------------- */

  const buildOptions = () => {
    dropdown.innerHTML = '';

    for (const entry of entries) {
      const item = document.createElement('div');
      item.className = 'leva__select-item';
      item.textContent = entry.label;

      item.onclick = () => {
        controller.set(entry.value);
        close();
      };

      dropdown.appendChild(item);
    }

    sync();
  };

  const sync = () => {
    const current = controller.value;
    const match = entries.find((e) => e.value === current);
    if (match) trigger.textContent = match.label;
  };

  /* ---------------------------------- */
  /* Events                             */
  /* ---------------------------------- */

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as Node;
    if (!trigger.contains(target) && !dropdown.contains(target)) {
      close();
    }
  };

  trigger.onclick = toggle;
  document.addEventListener('click', handleOutsideClick);

  controller.onChange(sync);

  /* ---------------------------------- */
  /* Init                               */
  /* ---------------------------------- */

  buildOptions();

  return container;
}
