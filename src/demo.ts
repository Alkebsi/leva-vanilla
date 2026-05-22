import { leva } from './core/leva';

type StateRecord = Record<string, unknown>;

document.body.style.cssText = `
  margin: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #17171a;
  overflow: hidden;
`;

const style = document.createElement('style');
style.textContent = `
  #json {
    position: absolute; left: 10px; top: 10px; padding: 15px 20px; z-index: 10;
    background: #1b1e28; box-sizing: border-box;
    box-shadow: var(--leva-shadows-level2); border-radius: var(--leva-radii-lg);
    color: #add7ff; font-family: var(--leva-fonts-mono); font-size: 0.8rem;
    line-height: 1.6; white-space: pre; overflow: hidden;
  }
  .line {
    display: block; transition: all 0.4s; padding: 0 24px; margin: 0 -24px;
  }
  .line.update {
    background: #0b0d11; color: #d1d1d1; transition: none;
  }
`;
document.head.append(style);

const container = document.createElement('div');
container.id = 'json';
document.body.prepend(container);

const renderJSON = (obj: StateRecord, path = '', indent = '  '): string => {
  return Object.entries(obj as StateRecord)
    .filter(([k]) => k !== 'effect')
    .map(([k, v]) => {
      const p = path ? `${path}-${k}` : k;
      if (typeof v === 'object' && v !== null && !('onClick' in v)) {
        return (
          `<span class="line">${indent}${k}: {</span>` +
          renderJSON(v as StateRecord, p, indent + '  ') +
          `<span class="line">${indent}},</span>`
        );
      }
      const color = '#5de4c7';
      return `<span id="l-${p}" class="line">${indent}${k}: <span style="color: ${color}">${JSON.stringify(v)}</span>,</span>`;
    })
    .join('');
};

const controls = leva(
  {
    text: 'Some Text',
    color: { value: '#ff0000', label: 'TestColor' },

    // Now, all of there colors input types can work!
    // alphaColor: '#ff000055',
    // rgb: { r: 255, g: 0, b: 0 },
    // rgba: { r: 255, g: 0, b: 0, a: 0.5 },
    // hsl: { h: 100, s: 50, l: 0.5 },
    // cssHsl: 'hsl(100, 50%, 50%)',
    // cssRgb: 'rgb(255, 0, 0)',
    // rgb1x: { r: 1, g: 0, b: 0 },

    Numbers: {
      number: 10,
      stepped: { value: 5, step: 1 },
    },
    Sliders: {
      slider: { value: 0.5, min: 0, max: 1 },
      steppedSlider: { value: 0.5, min: 0, max: 1, step: 0.1 },
    },
    Miscellaneous: {
      $: { label: 'Misc' },
      hideOptions: true,
      selection: {
        value: 'option 1',
        options: ['option 1', 'option 2', 'option 3'],
      },
      namedSelection: {
        value: 'L',
        options: {
          large: 'L',
          medium: 'M',
          Small: 'S',
        },
      },
    },
    button: {
      onClick: () => alert('The button works as expected'),
      label: 'Test Button',
    },
    logBtn: {
      onClick: () => logState(),
      label: 'Log State',
    },
    disabledBtn: {
      onClick: () => alert("This won't work, as expected, too!"),
      label: 'Disabled Button',
      disabled: true,
    },
  },
  { title: 'Leva Vanilla' }
);

const triggerFlash = (id: string) => {
  const el = document.getElementById(`l-${id}`);
  if (el) {
    el.classList.add('update');
    setTimeout(() => el.classList.remove('update'), 500);
  }
};

const getFlat = (obj: StateRecord, path = ''): StateRecord => {
  return Object.entries(obj).reduce<StateRecord>((acc, [k, v]) => {
    if (k === 'effect') return acc;
    const p = path ? `${path}-${k}` : k;
    if (typeof v === 'object' && v !== null && !('onClick' in v)) {
      Object.assign(acc, getFlat(v as StateRecord, p));
    } else {
      acc[p] = v;
    }
    return acc;
  }, {});
};

const logState = () => {
  console.log(getFlat(controls as unknown as StateRecord));
};

let last = getFlat(controls as unknown as StateRecord);

controls.effect(() => {
  const curr = getFlat(controls as unknown as StateRecord);
  const changed = Object.keys(curr).filter((k) => curr[k] !== last[k]);

  container.innerHTML =
    `<span class="line" style="color: #595f78">// state</span>` +
    `<span class="line"><span style="color: #91b4d5">const</span> <span style="color: #e0e0e0">controls</span> = {</span>` +
    renderJSON(controls as unknown as StateRecord) +
    `<span class="line">};</span>`;

  changed.forEach(triggerFlash);
  last = curr;

  controls.visibility(
    'Miscellaneous.namedSelection',
    controls.Miscellaneous.hideOptions
  );
  controls.visibility(
    'Miscellaneous.selection',
    controls.Miscellaneous.hideOptions
  );
});
