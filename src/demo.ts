import { leva } from './core/leva';

const box = document.createElement('div');
document.body.append(box);

box.style.setProperty('width', '20px');
box.style.setProperty('height', '20px');
box.style.setProperty('background-color', 'red');

const controls = leva({
  width: { value: 2, min: 0, max: 9, step: 0.1 },
  height: 2,
  mul: { value: true, label: 'MultiplySize' },
  mode: {
    value: 'b',
    options: {
      red: 'r',
      green: 'g',
      blue: 'b',
    },
    label: 'whyNOt!',
  },
  button: {
    onClick: () => console.log('clicked'),
    label: 'Something else',
    disabled: true,
  },
});

controls.effect(() => {
  box.style.width = `${controls.width * (controls.mul ? 50 : 10)}px`;
  box.style.height = `${controls.height * (controls.mul ? 50 : 10)}px`;

  if (controls.mode === 'r') {
    box.style.backgroundColor = '#6e4747ff';
  } else if (controls.mode === 'g') {
    box.style.backgroundColor = '#405544ff';
  } else if (controls.mode === 'b') {
    box.style.backgroundColor = '#474e6eff';
  } else {
    console.error('something went wrong with: ', controls.mode);
  }
});
