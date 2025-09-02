# Pinchable

Lightweight, dependency-free wrapper that adds mobile-friendly pinch-zoom and panning to any HTML element.

## Demo

Interactive demo: https://pinch-six.vercel.app/

## Features

- Smooth pinch-zoom with the touch center anchored.
- Panning with edge clamping and subtle thresholding for a natural feel.
- Programmatic `focus()` to zoom to a specific point using normalized `[0..1]` coordinates.
- `setEnabled()` to toggle gestures on the fly.
- Clean `dispose()` teardown.
- Works with any DOM element.

## Usage

You can install Pinchable via npm:

```bash
npm install --save pinchable
```

Use it in your JavaScript or TypeScript project like this:

```ts
import { Pinchable } from "pinchable";

const container = document.getElementById("photo") as HTMLElement;

const pinchable = new Pinchable(container, {
    maxZoom: 3, // maximum zoom scale
    minZoom: 0.5, // minimum zoom scale (1 = original size, default is 1)
    velocity: 0.7, // pinch sensitivity
    applyTime: 400, // ms transition when programmatically focusing
});

// Programmatically zoom to a point
pinchable.focus({
    zoom: 2,
    to: { x: 0.5, y: 0.5 }, // values between 0 and 1 (others will be clamped)
});

// Disable/enable gestures
pinchable.setEnabled(false);
pinchable.setEnabled(true);

// Clean up when done
pinchable.dispose();
```

`minZoom` defaults to `1`, preventing zooming out beyond the original size. Set it lower to allow zooming out while keeping the element centered. `focus()` expects the `to` coordinates to be normalized between `0` and `1` relative to the element size; values outside this range are clamped.

## Compatibility

- Mobile/touch devices only
- Uses modern Pointer Events API (tested in evergreen mobile browsers).

## Notes

This is a personal pet project; APIs may change. Feedback and contributions are welcome!
