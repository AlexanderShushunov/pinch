import { RawPinchDetector } from "./RawPinchDetector";

function initRawPinchDetectorDemo() {
    const element = document.getElementById("RawPinchDetector");
    const disposeButton = document.getElementById("disposeButton");
    if (element === null || disposeButton === null) {
        console.error("Required elements not found in the document.");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
    element.appendChild(canvas);

    const rawPinchDetector = new RawPinchDetector({
        element: element,
        onStart: () => {
            update();
        },
        onPinch: () => {
            update();
        },
    });

    const update = () => {
        const ctx = canvas.getContext("2d");
        const center = rawPinchDetector.center ?? { x: 0, y: 0 };
        const shift = rawPinchDetector.shift ?? { x: 0, y: 0 };
        const distance = rawPinchDetector.distance ?? 0;
        const isPinch = rawPinchDetector.isPinch ?? false;
        const dest = {
            x: center.x + shift.x,
            y: center.y + shift.y,
        };
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(center.x - 10, center.y);
            ctx.lineTo(center.x + 10, center.y);
            ctx.moveTo(center.x, center.y - 10);
            ctx.lineTo(center.x, center.y + 10);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(dest.x, dest.y);
            ctx.strokeStyle = "green";
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(dest.x, dest.y, distance / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "blue";
            ctx.fillStyle = "rgba(173, 216, 230, 0.5)";
            ctx.fill();
            ctx.stroke();
            ctx.font = "16px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(
                `center: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}`, 20, 20,
            );
            ctx.fillText(
                `shift: ${shift.x.toFixed(2)}, ${shift.y.toFixed(2)}`, 20, 40,
            );
            ctx.fillText(
                `distance: ${distance.toFixed(2)}`, 20, 60,
            );
            ctx.fillText(
                `isPinch: ${isPinch}`, 20, 80,
            );
        }
    };

    disposeButton.addEventListener("click", () => {
        rawPinchDetector.dispose();
    });
    return () => {
        rawPinchDetector.dispose();
    };
}

initRawPinchDetectorDemo();
