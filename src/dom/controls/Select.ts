import SelectController, {
  type SelectOptions,
} from '../../core/SelectController';
import icons from '../../icons';
import { internalsOf } from '../../utils/types';
import Row from './Row';

type Entry<V> = {
  label: string;
  value: V;
};

export default class Select<O extends object, K extends keyof O> {
  constructor(container: HTMLElement, controller: SelectController<O, K>) {
    const select = document.createElement('select');

    select.className = 'leva__input';
    select.classList.add('leva__input--select');

    const internals = internalsOf(controller);
    const key = String(internals.key);

    select.name = key;
    select.id = key;

    const title = document.createElement('div');
    title.className = 'leva__input--title';

    const row = new Row(container, controller);
    row.control.classList.add('leva__control--select-parent');

    const downArrowEl = document.createElement('div');
    downArrowEl.setAttribute('aria-hidden', 'true');
    downArrowEl.innerHTML = icons.downArrow;

    // Append select, title and the icon element to the control
    row.control.append(select, title, downArrowEl);

    let entries: Entry<O[K]>[] = [];

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

    const buildOptions = () => {
      select.innerHTML = '';

      entries = normalizeOptions(controller.options);

      for (const entry of entries) {
        const option = document.createElement('option');
        option.textContent = entry.label;
        option.value = entry.label;
        select.appendChild(option);
      }

      sync();
    };

    const sync = () => {
      const current = controller.get();

      const match = entries.find((e) => e.value === current);

      if (match && select.value !== match.label) {
        select.value = match.label;
      }

      title.innerHTML = select.options[select.options.selectedIndex].value;
    };

    select.onchange = () => {
      const selectedLabel = select.value;

      const found = entries.find((e) => e.label === selectedLabel);

      if (found) {
        controller.set(found.value);
      }

      title.innerHTML = select.options[select.options.selectedIndex].value;
    };

    buildOptions();

    internals.onOptionsChange(buildOptions);

    internals.onOptionsChange(() => {
      row.label.textContent = internals.getName() || key;
    });
  }
}
