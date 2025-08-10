import { PinchedElementWrapper } from "./PinchedElementWrapper";

function initPinchedElementWrapperDemo() {
    const element = document.getElementById("PinchedElementWrapper");
    const moveRandomlyButton = document.getElementById("moveRandomlyButton");
    const resetButton = document.getElementById("resetButton");
    const moveTopZoomButton = document.getElementById("moveTopZoomButton");
    const transitionCheckbox = document.getElementById("withTransition") as HTMLInputElement;
    const moveTimeInput = document.getElementById("moveTime") as HTMLInputElement;

    if (
        !element ||
        !moveRandomlyButton ||
        !resetButton ||
        !moveTopZoomButton ||
        !transitionCheckbox ||
        !moveTimeInput
    ) {
        console.error("Required elements not found in the document.");
        return;
    }

    let moveTime = parseInt(moveTimeInput.value, 10);
    let withTransition = transitionCheckbox.checked;

    let pinchedElementWrapper = new PinchedElementWrapper(element, moveTime);

    moveTimeInput.addEventListener("change", () => {
        moveTime = parseInt(moveTimeInput.value, 10);
        pinchedElementWrapper = new PinchedElementWrapper(element, moveTime);
    });

    transitionCheckbox.addEventListener("change", () => {
        withTransition = transitionCheckbox.checked;
    });

    moveRandomlyButton.addEventListener("click", () => {
        const zoom = 0.1 + Math.random() * 3.1;
        const translateX = Math.random() * 300 - 200;
        const translateY = Math.random() * 300 - 200;

        pinchedElementWrapper.transform({
            zoom: zoom,
            translate: { x: translateX, y: translateY },
            withTransition: withTransition,
        });
    });

    resetButton.addEventListener("click", () => {
        pinchedElementWrapper.transform({
            zoom: 1,
            translate: { x: 0, y: 0 },
            withTransition: withTransition,
        });
    });

    moveTopZoomButton.addEventListener("click", () => {
        for (let i = 0; i < 300; i++) {
            setTimeout(() => {
                const randomShift = Math.random() * 4 - 2;
                pinchedElementWrapper.transform({
                    zoom: 1 + (0.5 * (i + 1)) / 300, // Incremental zoom
                    translate: { y: -i + randomShift, x: 0 },
                    withTransition: withTransition,
                });
            }, i);
        }
    });
}

initPinchedElementWrapperDemo();
