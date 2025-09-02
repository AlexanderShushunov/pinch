import { Pinchable } from "./Pinchable.ts";

function createFillCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.position = "relative";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    container.appendChild(canvas);
    return canvas;
}

function drawPoint(canvas: HTMLCanvasElement, x: number, y: number): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    const xPos = x * canvas.width;
    const yPos = y * canvas.height;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;

    const crossSize = 10;

    ctx.beginPath();
    ctx.moveTo(xPos - crossSize, yPos);
    ctx.lineTo(xPos + crossSize, yPos);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xPos, yPos - crossSize);
    ctx.lineTo(xPos, yPos + crossSize);
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.font = "14px Arial";
    ctx.fillText(`${x}, ${y}`, xPos - 50, yPos - 10);
}

export function initPinchableDemo(): void {
    const container = document.getElementById("pinchContainer") as HTMLDivElement;
    const maxZoomInput = document.getElementById("maxZoom") as HTMLInputElement;
    const maxZoomValue = document.getElementById("maxZoomValue") as HTMLSpanElement;
    const minZoomInput = document.getElementById("minZoom") as HTMLInputElement;
    const minZoomValue = document.getElementById("minZoomValue") as HTMLSpanElement;
    const velocityInput = document.getElementById("velocity") as HTMLInputElement;
    const velocityValue = document.getElementById("velocityValue") as HTMLSpanElement;
    const applyTimeInput = document.getElementById("applyTime") as HTMLInputElement;
    const applyTimeValue = document.getElementById("applyTimeValue") as HTMLSpanElement;
    const zoomThresholdInput = document.getElementById("zoomThreshold") as HTMLInputElement;
    const zoomThresholdValue = document.getElementById("zoomThresholdValue") as HTMLSpanElement;
    const shiftThresholdInput = document.getElementById("shiftThreshold") as HTMLInputElement;
    const shiftThresholdValue = document.getElementById("shiftThresholdValue") as HTMLSpanElement;
    const resetButton = document.getElementById("resetButton") as HTMLButtonElement;
    const movePoint1 = document.getElementById("movePoint1") as HTMLButtonElement;
    const movePoint2 = document.getElementById("movePoint2") as HTMLButtonElement;
    const movePoint3 = document.getElementById("movePoint3") as HTMLButtonElement;
    const movePoint4 = document.getElementById("movePoint4") as HTMLButtonElement;
    const zoomLessThanOne = document.getElementById("zoomLessThanOne") as HTMLButtonElement;
    const disableButton = document.getElementById("disableButton") as HTMLButtonElement;
    const enableButton = document.getElementById("enableButton") as HTMLButtonElement;

    if (
        !container ||
        !maxZoomInput ||
        !minZoomInput ||
        !velocityInput ||
        !applyTimeInput ||
        !resetButton ||
        !movePoint1 ||
        !movePoint2 ||
        !movePoint3 ||
        !movePoint4 ||
        !zoomLessThanOne ||
        !disableButton ||
        !enableButton ||
        !maxZoomValue ||
        !minZoomValue ||
        !velocityValue ||
        !applyTimeValue ||
        !zoomThresholdInput ||
        !zoomThresholdValue ||
        !shiftThresholdInput ||
        !shiftThresholdValue
    ) {
        console.error("Required elements not found in the document.");
        return;
    }

    const canvas = createFillCanvas(container);

    // Draw reference points
    drawPoint(canvas, 0.2, 0.5);
    drawPoint(canvas, 0.9, 0.8);
    drawPoint(canvas, 0.5, 0.1);
    drawPoint(canvas, 0.4, 0.7);

    // Initialize parameters
    let maxZoom = parseFloat(maxZoomInput.value);
    let minZoom = parseFloat(minZoomInput.value);
    let velocity = parseFloat(velocityInput.value);
    let applyTime = parseInt(applyTimeInput.value, 10);
    let zoomThreshold = parseFloat(zoomThresholdInput.value);
    let shiftThreshold = parseInt(shiftThresholdInput.value, 10);

    // Create Pinchable instance
    let pinchable = new Pinchable(container, {
        maxZoom: maxZoom,
        minZoom: minZoom,
        velocity: velocity,
        applyTime: applyTime,
        zoomThreshold: zoomThreshold,
        shiftThreshold: shiftThreshold,
    });

    // Update value displays
    function updateValueDisplays(): void {
        maxZoomValue.textContent = maxZoom.toString();
        minZoomValue.textContent = minZoom.toString();
        velocityValue.textContent = velocity.toString();
        applyTimeValue.textContent = applyTime.toString();
        zoomThresholdValue.textContent = zoomThreshold.toFixed(2);
        shiftThresholdValue.textContent = shiftThreshold.toString();
    }
    updateValueDisplays();

    // Handle parameter changes
    maxZoomInput.addEventListener("input", () => {
        maxZoom = parseFloat(maxZoomInput.value);
        updateValueDisplays();
        reinitializePinchable();
    });

    minZoomInput.addEventListener("input", () => {
        minZoom = parseFloat(minZoomInput.value);
        updateValueDisplays();
        reinitializePinchable();
    });

    velocityInput.addEventListener("input", () => {
        velocity = parseFloat(velocityInput.value);
        updateValueDisplays();
        reinitializePinchable();
    });

    applyTimeInput.addEventListener("input", () => {
        applyTime = parseInt(applyTimeInput.value, 10);
        updateValueDisplays();
        reinitializePinchable();
    });

    zoomThresholdInput.addEventListener("input", () => {
        zoomThreshold = parseFloat(zoomThresholdInput.value);
        updateValueDisplays();
        reinitializePinchable();
    });

    shiftThresholdInput.addEventListener("input", () => {
        shiftThreshold = parseInt(shiftThresholdInput.value, 10);
        updateValueDisplays();
        reinitializePinchable();
    });

    function reinitializePinchable(): void {
        pinchable.dispose();
        pinchable = new Pinchable(container, {
            maxZoom: maxZoom,
            minZoom: minZoom,
            velocity: velocity,
            applyTime: applyTime,
            zoomThreshold: zoomThreshold,
            shiftThreshold: shiftThreshold,
        });
    }

    // Button actions
    resetButton.addEventListener("click", () => {
        pinchable.focus({
            zoom: 1,
            to: { x: 0, y: 0 },
        });
    });

    movePoint1.addEventListener("click", () => {
        pinchable.focus({
            zoom: 1.5,
            to: { x: 0.2, y: 0.5 },
        });
    });

    movePoint2.addEventListener("click", () => {
        pinchable.focus({
            zoom: 1.5,
            to: { x: 0.9, y: 0.8 },
        });
    });

    movePoint3.addEventListener("click", () => {
        pinchable.focus({
            zoom: 1.5,
            to: { x: 0.5, y: 0.1 },
        });
    });

    movePoint4.addEventListener("click", () => {
        pinchable.focus({
            zoom: 1.5,
            to: { x: 0.4, y: 0.7 },
        });
    });

    zoomLessThanOne.addEventListener("click", () => {
        pinchable.focus({
            zoom: 0.8,
            to: { x: 1, y: 1 },
        });
    });

    disableButton.addEventListener("click", () => {
        pinchable.setEnabled(false);
    });

    enableButton.addEventListener("click", () => {
        pinchable.setEnabled(true);
    });
}

initPinchableDemo();
