import SelectController, {
  type SelectOptions,
} from '../../core/SelectController';
import icons from '../../icons';
import { generateId } from '../../utils/generateId';
import { internalsOf } from '../../utils/types';
import Row from './Row';

type Entry<V> = {
  label: string;
  value: V;
};

export default class Select<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: SelectController<O, K>) {
    const internals = internalsOf(controller);
    const key = String(internals.key);
    const elementId = generateId(`leva_${key}`);

    const row = new Row(container, controller);
    row.control.classList.add('leva__control--select-parent');
    row.label.htmlFor = elementId;

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
    const downArrowEl = document.createElement('div');
    downArrowEl.setAttribute('aria-hidden', 'true');
    downArrowEl.innerHTML = icons.downArrow;

    row.control.append(trigger, downArrowEl);
    document.querySelector('#leva__root')?.appendChild(dropdown);

    let entries: Entry<O[K]>[] = [];
    let isOpen = false;

    const normalizeOptions = (options?: SelectOptions<O[K]>) => {
      if (!options) return [];

      if (Array.isArray(options)) {
        return options.map((value) => ({
          label: String(value),
          value,
        }));
      }

      return Object.entries(options).map(([label, value]) => ({
        label,
        value,
      }));
    };

    const open = () => {
      const rect = trigger.getBoundingClientRect();

      dropdown.hidden = false;
      const dropdownHeight = dropdown.offsetHeight;
      dropdown.hidden = true;

      const dropdownWidth = rect.width;

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = rect.bottom + 4;
      let left = rect.left;

      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 8;
      }

      if (left < 8) {
        left = 8;
      }

      dropdown.style.position = 'fixed';
      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
      dropdown.style.width = `${dropdownWidth}px`;

      dropdown.hidden = false;
      isOpen = true;
    };

    const close = () => {
      dropdown.hidden = true;
      isOpen = false;
    };

    trigger.onclick = () => {
      if (isOpen) close();
      else open();
    };

    document.addEventListener('click', (e) => {
      if (
        !trigger.contains(e.target as Node) &&
        !dropdown.contains(e.target as Node)
      ) {
        close();
      }
    });

    const buildOptions = () => {
      dropdown.innerHTML = '';
      entries = normalizeOptions(controller.options);

      for (const entry of entries) {
        const item = document.createElement('div');
        item.className = 'leva__select-item';
        item.textContent = entry.label;

        item.onclick = () => {
          controller.set(entry.value);
          close();
          sync();
        };

        dropdown.appendChild(item);
      }

      sync();
    };

    const sync = () => {
      const current = controller.get();
      const match = entries.find((e) => e.value === current);

      if (match) {
        trigger.textContent = match.label;
      }
    };

    buildOptions();

    internals.onOptionsChange(buildOptions);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || key;
    });
  }
}
