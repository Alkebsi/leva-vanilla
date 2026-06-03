# leva-vanilla

![NPM Version](https://img.shields.io/npm/v/leva-vanilla?color=007bff&labelColor=333&style=flat-square)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/leva-vanilla?color=007bff&labelColor=333&style=flat-square)
![Total Downloads](https://img.shields.io/npm/dt/leva-vanilla?color=007bff&labelColor=333&style=flat-square)
![License](https://img.shields.io/npm/l/leva-vanilla?color=007bff&labelColor=333&style=flat-square)

A lightweight, framework-agnostic control panel with a reactive, schema-based API.

Tweak values in real-time without React, without dependencies.

## Why

Most GUI libraries fall into one of two categories:

- Simple but limited (dat.gui, lil-gui)
- Powerful but tied to frameworks (Leva)

leva-vanilla aims to combine both:

- ✅ Works in plain JavaScript
- ✅ Reactive state without a framework
- ✅ Scales cleanly as your UI grows

## Installation

```bash
npm install leva-vanilla
```

## Quick Start

```js
import { leva } from 'leva-vanilla';

const box = document.createElement('div');

const controls = leva({
  width: { value: 10, min: 10, max: 160, step: 10 },
  height: { value: 10, min: 10, max: 160, step: 10 },
  color: '#ff0000ff',
});

controls.effect(() => {
  box.style.width = `${controls.width}px`;
  box.style.height = `${controls.height}px`;
  box.style.backgroundColor = controls.color;
});

setTimeout(() => {
  controls.width = 60;
  controls.height = 60;
  controls.color = '#777';
}, 1000);

document.body.append(box);
```

No `.onChange`, no manual wiring.

## Core Idea

Controls are just reactive state.

```js
controls.positionX = 5;
console.log(controls.positionX);
```

Use `effect()` to react to changes:

```js
controls.effect(() => {
  console.log(controls.positionX);
});
```

## API

### Create controls

```js
const controls = leva(schema, options?)
```

### Schema

#### Primitive values

```js
const controls = leva({
  speed: 1,
  enabled: true,
  username: 'MKebsi',
});
```

#### Descriptors

```js
const controls = leva({
  speed: { value: 1, min: 0, max: 10, step: 0.1, label: 'SpeedMeter' },
});
```

#### Select

Shorthand array syntax uses the values as labels:

```js
const controls = leva({
  mode: ['a', 'b', 'c'],
});
```

Map labels to internal values using the `options` object:

```js
const controls = leva({
  size: {
    options: {
      small: 's',
      medium: 'm',
      large: 'l',
      extraLarge: 'xl',
    },
  },
});
```

#### Color

Leva supports Hex, RGB, RGBA, HSL, and CSS strings out of the box:

```js
const controls = leva({
  color: '#ff0000',
  alphaColor: '#ff000055',
  rgb: { r: 255, g: 0, b: 0 },
  rgba: { r: 255, g: 0, b: 0, a: 0.5 },
  oneDecimalRGB: { r: 1, g: 0, b: 0 },
  hsl: { h: 100, s: 50, l: 0.5 },
  cssHsl: 'hsl(100, 50%, 50%)',
  cssRgb: 'rgb(255, 0, 0)',
});
```

#### Folder (WIP)

```js
const controls = leva({
  Settings: {
    speed: 1,
    enabled: true,
    $: {
      title: 'Folder_Name',
      collapsed: true,
    },
  },
});
```

### Reactivity

```js
const cleanup = controls.effect(() => {
  console.log(controls.speed);
});

// stop the effect/proxy
cleanup();
```

## Philosophy

- State-first API
- Minimal surface area
- No framework required
- Designed to scale

## Contributing

Feedback and ideas are welcome — especially around API design and developer experience.
