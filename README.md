# leva-vanilla

A lightweight, framework-agnostic control panel inspired by Leva — built for plain JavaScript.

Tweak values in real-time without React, without dependencies.

> [!IMPORTANT]
> Work in progress — API may change.

---

## Why this exists

Leva is great — but tied to React.

`leva-vanilla` brings the same idea to:

- plain JavaScript  
- small projects  
- custom tools  
- creative coding setups  

No framework. No overhead. Just controls.

---

## Features

- Numeric, boolean, color, range, and text controls  
- Live updates with `.onChange`  
- Type inference (based on value)  
- Add/remove controls at runtime  
- Minimal styling, easy to override  
- Small and dependency-free  

---

## Installation

_Not published yet_

```bash
npm install leva-vanilla
```

---

## Quick Start

```js
import GUI from 'leva-vanilla';

const gui = new GUI();

const params = {
  speed: 1,
  enabled: true,
  color: '#ff0000',
  label: 'hello'
};

gui.add(params, 'speed', 0, 10, 0.1)
  .onChange(v => console.log('speed', v));

gui.add(params, 'enabled')
  .onChange(v => console.log('enabled', v));

gui.addColor(params, 'color')
  .onChange(v => console.log('color', v));

gui.add(params, 'label')
  .onChange(v => console.log('label', v));
```

---

## API

### Create GUI

```js
const gui = new GUI(container?);
```

- `container` defaults to `document.body`  

---

### Add Controls

```js
gui.add(object, key, min?, max?, step?)
gui.add(object, key, options)
gui.addColor(object, key)
```

- Type is inferred from the value  
- Passing an object creates a select control  

---

### Folders (not ready yet)

```js
const folder = gui.addFolder('Settings');
folder.add(params, 'speed');
```

---

### Controller Methods

```ts
controller.onChange(fn)
controller.set(value)
controller.get()
controller.name(label)
controller.listen()
controller.destroy()
```

---

### GUI Methods

```ts
gui.update()
gui.destroy()
```

---

## Design Philosophy

- Object-first API — like dat.gui
- No magic state — your object is the source
- Framework-agnostic — works anywhere, can be wrapped for React/Vue/... you name it!
- Composable internals — controllers are independent units

---

## Example (Vanilla HTML)

```html
<!doctype html>
<html>
  <body>
    <script type="module">
      import GUI from 'leva-vanilla';

      const gui = new GUI();

      const params = {
        rotation: 45,
        visible: true
      };

      const rot = gui.add(params, 'rotation', 0, 360, 1)
        .onChange(v => {
          document.body.style.transform = `rotate(${v}deg)`;
        });

      gui.add(params, 'visible')
        .onChange(v => {
          document.body.style.opacity = v ? 1 : 0.5;
        });

      setTimeout(() => rot.set(90), 1000);
    </script>
  </body>
</html>
```

---

## Contributing

- Open issues for bugs or ideas  
- PRs are welcome  
- Keep it small, simple, and dependency-free  

---


> [!NOTE]
> This project is still experimental. <br>
> Expect:<br>
> - API changes<br>
> - Internal refactors<br>  
> - Breaking updates  
