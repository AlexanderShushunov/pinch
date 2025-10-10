# Pinchable

**Pinchable** is a **lightweight**, **dependency-free** JavaScript library that adds smooth **pinch-zoom** and **panning** to any HTML element — perfect for mobile galleries.

[![npm](https://img.shields.io/npm/v/pinchable.svg)](https://www.npmjs.com/package/pinchable)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/pinchable)](https://bundlephobia.com/package/pinchable)
[![License: MIT](https://img.shields.io/npm/l/pinchable)](LICENSE)

---

## Demos

Try Pinchable live:

- **Playground** → https://pinch-six.vercel.app/
- **React demo** → https://pinch-react-demo.vercel.app/
- **Vue demo** → https://pinch-vue-demo.vercel.app/

---

## Features

- Smooth **pinch-zoom** anchored to touch center
- **Pan** with edge clamping and threshold smoothing
- **Programmatic zooming** via `focus({ zoom, to })` using normalized `[0–1]` coordinates
- **Toggle gestures** dynamically with `setEnabled()`
- **Event system**: `"start"`, `"pinch"`, `"end"` + `unsubscribe()` helpers
- **Clean teardown** with `dispose()`
- Works with **any DOM element** — no frameworks, no dependencies

---

## Installation

```bash
npm install pinchable
```

or

```bash
yarn add pinchable
```

---

## Basic Usage

```ts
import { Pinchable } from "pinchable";

const container = document.getElementById("photo")!;

const pinchable = new Pinchable(container, {
    maxZoom: 3,
    minZoom: 0.5,
    edgeZoomThreshold: 0.2,
    nearZeroZoomThreshold: 0.07,
    shiftThreshold: 10,
    velocity: 0.7,
    applyTime: 400,
});

// Zoom to center
pinchable.focus({ zoom: 2, to: { x: 0.5, y: 0.5 } });

// Disable or enable gestures
pinchable.setEnabled(false);
pinchable.setEnabled(true);

// Subscribe to events
const unsubscribePinch = pinchable.subscribe("pinch", (zoom, shift) => {
    console.log("zoom", zoom, "shift", shift);
});

// Cleanup
unsubscribePinch();
pinchable.dispose();
```

---

## API Reference

| Method                         | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| `focus({ zoom, to })`          | Programmatically zoom to a specific normalized point                        |
| `setEnabled(enabled: boolean)` | Enable or disable gestures                                                  |
| `subscribe(event, handler)`    | Listen to `"start"`, `"pinch"`, or `"end"` events (returns `unsubscribe()`) |
| `dispose()`                    | Remove listeners and reset element                                          |

**Options**

| Option                  | Default | Description                                    |
| ----------------------- | ------- | ---------------------------------------------- |
| `maxZoom`               | `3`     | Maximum zoom factor                            |
| `minZoom`               | `1`     | Minimum zoom factor                            |
| `edgeZoomThreshold`     | `0.2`   | Overshoot tolerance before clamping            |
| `nearZeroZoomThreshold` | `0.07`  | Smoothing zone near zoom = 1                   |
| `shiftThreshold`        | `10`    | Extra pixels beyond edges before clamping      |
| `velocity`              | `0.7`   | Pinch sensitivity                              |
| `applyTime`             | `400`   | Duration (ms) for programmatic zoom transition |

---

## Compatibility

- Touch devices only
- Based on the **Pointer Events API**
- Tested on iOS Safari and Android Chrome

---

## Integrations

- [React demo](https://pinch-react-demo.vercel.app/)
- [Vue demo](https://pinch-vue-demo.vercel.app/)
  Use the same core API — the wrapper handles setup only.

---

## Development

```bash
git clone https://github.com/AlexanderShushunov/pinch
cd pinch
npm install
npm run dev
```

---

## License

MIT © [Alexander Shushunov](https://github.com/AlexanderShushunov)

---

**Keywords:** pinch zoom, gesture, touch, pan, mobile, pinchable, pinch-zoom, pointer events, no dependencies, vanilla js
