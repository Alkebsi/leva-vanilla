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

const controls = leva({
  positionX: { value: 1, min: 0, max: 10 },
  color: '#ff0000',
});

controls.effect(() => {
  element.style.background = controls.color;
  mesh.position.x = controls.positionX;
});
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
  label: 'hello',
});
```

#### Descriptors

```js
const controls = leva({
  speed: { value: 1, min: 0, max: 10, step: 0.1 },
});
```

#### Select

```js
const controls = leva({
  mode: ['a', 'b', 'c'],
});
```

#### Color (Not Ready)

```js
const controls = leva({
  color: '#ff0000',
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

// stop the effect
cleanup();
```

## Philosophy

- State-first API
- Minimal surface area
- No framework required
- Designed to scale

## Contributing

Feedback and ideas are welcome — especially around API design and developer experience.
