import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import GUI from './dom/GUI';

const data = {
  foo: 0,
  bar: 0,
  color: '#1f1f1f',
  textTest: 'some text to test',
  enabled: true,
  cubeSize: 'medium',
};
const data2 = {
  alertUser: () => {
    alert(`foo is ${data.foo}, bar is ${data.bar}`);
  },
};
const gui = new GUI();
const folder1 = gui.addFolder('First Folder');
const folder2 = gui.addFolder('Second Folder');

// Vanilla Three.js app
const canvas = document.createElement('canvas');
canvas.style.setProperty('position', 'fixed');
canvas.style.setProperty('top', '0');
canvas.style.setProperty('left', '0');
canvas.style.setProperty('width', '100vw');
canvas.style.setProperty('height', '100vh');
canvas.style.setProperty('z-index', '-1');

const scene = new Scene();
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 0, 5);

const cube = new Mesh(
  new BoxGeometry(),
  new MeshBasicMaterial({
    color: data.color,
    side: DoubleSide,
    // wireframe: true
  })
);

scene.add(cube);

const text = document.createElement('p');
text.style.setProperty('position', 'fixed');
text.style.setProperty('color', 'white');
text.style.setProperty('top', '20px');
text.style.setProperty('right', '40px');
text.style.setProperty('z-index', '2');

document.body.appendChild(text); // this is as you said, need to update if subscribe is set correctly, but it is not for a clear reason

folder1
  .add(data, 'foo')
  .onChange((value) => {
    if (data.enabled) cube.position.x = value;
    else cube.position.y = value;
  })
  .name(`PositionX/Y`);
folder1
  .add(data, 'bar', -1, 1, 0.01)
  .onChange((value) => {
    if (data.enabled) cube.position.y = value;
    else cube.position.x = value;
  })
  .name('PositionY/X');

// gui.add(data, 'y').min(-2).max(2).step(0.001).onChange((value) => {
//   cube.position.y = value
// });

folder2.addColor(data, 'color').onChange((value) => {
  cube.material.color.set(value);
}); // color picker
folder1.add(data, 'textTest');
// .onChange((value) => {console.log(value);}); // Text

folder2.add(data, 'enabled').name('Twist-X/Y'); // checkbox
gui.add(data2, 'alertUser'); // function button
gui.add(data, 'cubeSize', ['large', 'medium', 'small']).onChange((value) => {
  changeScale(value);
}); // options selection

// const folder = gui.addFolder('Transform');
// folder.add(data, 'x');
// folder.add(data, 'y');

const changeScale = (value: typeof data.cubeSize) => {
  if (value === 'small') cube.scale.setScalar(0.5);
  else if (value === 'medium') cube.scale.setScalar(1);
  else if (value === 'large') cube.scale.setScalar(1.5);
  // else console.error('The chosen option was set to an unknown value');
};
changeScale(data.cubeSize);

const anim = () => {
  // data.foo = Math.sin(time);

  // gui.update();

  renderer.render(scene, camera);
  requestAnimationFrame(() => {
    anim();
  });
};

anim();

const resize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

window.addEventListener('resize', () => {
  resize();
});

document.body.appendChild(canvas);
