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

  document.body.appendChild(dropdown);

  control.classList.add('leva__control--select-parent');

  const entries: Entry[] = controller.options;
  let isOpen = false;

  const positionDropdown = () => {
    const rect = trigger.getBoundingClientRect();

    dropdown.style.display = 'block';
    dropdown.hidden = false;
    const height = dropdown.offsetHeight;
    dropdown.hidden = true;
    dropdown.style.display = '';

    const width = rect.width;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: Below trigger
    let top = rect.bottom + 4;
    let left = rect.left;

    // Flip to top if no space below
    if (rect.bottom + height > vh && rect.top > height) {
      top = rect.top - height - 4;
    }

    // Horizontal overflow check
    if (left + width > vw) {
      left = vw - width - 8;
    }
    if (left < 8) left = 8;

    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.width = `${width}px`;
    dropdown.style.zIndex = '100000';
  };

  const open = () => {
    positionDropdown();
    dropdown.hidden = false;
    isOpen = true;
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('resize', positionDropdown);
  };

  const close = () => {
    dropdown.hidden = true;
    isOpen = false;
    window.removeEventListener('scroll', positionDropdown, true);
    window.removeEventListener('resize', positionDropdown);
  };

  const toggle = () => (isOpen ? close() : open());

  const buildOptions = () => {
    dropdown.innerHTML = '';
    for (const entry of entries) {
      const item = document.createElement('div');
      item.className = 'leva__select-item';
      item.textContent = entry.label;
      item.onclick = (e) => {
        e.stopPropagation();
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

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as Node;
    if (!trigger.contains(target) && !dropdown.contains(target)) {
      close();
    }
  };

  trigger.onclick = () => {
    toggle();
  };

  document.addEventListener('click', handleOutsideClick);

  const unsubscribeVisibility = controller.onVisibleChange((isVisible) => {
    container.classList.toggle('visibility-hidden', !isVisible);
    if (!isVisible && isOpen) close();
  });

  const unsubscribeChange = controller.onChange(sync);

  buildOptions();

  const cleanup = () => {
    document.removeEventListener('click', handleOutsideClick);
    window.removeEventListener('scroll', positionDropdown, true);
    window.removeEventListener('resize', positionDropdown);
    unsubscribeChange();
    unsubscribeVisibility();
    dropdown.remove();
    container.remove();
  };
  controller.onDispose(cleanup);

  return container;
}
