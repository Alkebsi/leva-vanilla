import GUI from './dom/GUI';

const controls = {
  text: 'Some text',
  number: 0,
  steppedNumber: 0,
  slider: 0.5,
  steppedSlider: 0.5,
  checkbox: false,
  selection: 'option 3',
  NamedSelection: 'S',
  color: '#ff0062',
};

// Rendering the result to HTML
const codeText = document.createElement('div');
const div = document.createElement('div');
div.id = 'controls-display-container';
div.appendChild(codeText);
document.body.prepend(div);

const update = (key?: string) => {
  const keys = Object.keys(controls);
  codeText.innerHTML = `const controls = {\n${keys
    .map((k) => {
      const isLast = keys[keys.length - 1] === k;
      const value = JSON.stringify(controls[k as keyof typeof controls]);
      return `  <span id="l-${k}" class="control-line">  ${k}: ${value}${isLast ? '' : ','}</span>`;
    })
    .join('\n')}\n};`;

  const el = document.getElementById(`l-${key}`);
  if (el) {
    el.classList.add('update');
    void (el as HTMLElement).offsetWidth;
    setTimeout(() => el.classList.remove('update'), 50);
  }
};
update();

// Creating the GUI
const gui = new GUI();

gui.add(controls, 'text').onChange(() => update('text'));
gui.add(controls, 'number').onChange(() => update('number'));
gui
  .add(controls, 'steppedNumber')
  .step(1)
  .onChange(() => update('steppedNumber'));
gui.add(controls, 'slider', 0, 1).onChange(() => update('slider'));
gui
  .add(controls, 'steppedSlider', 0, 1, 0.5)
  .onChange(() => update('steppedSlider'));
gui.add(controls, 'checkbox').onChange(() => update('checkbox'));
gui
  .add(controls, 'selection', ['option 1', 'option 2', 'option 3'])
  .onChange(() => update('selection'));
gui
  .add(controls, 'NamedSelection', {
    Small: 'S',
    Medium: 'M',
    Large: 'L',
    'Extra Large': 'XL',
  })
  .onChange(() => update('NamedSelection'));
gui.addColor(controls, 'color').onChange(() => update('color'));
