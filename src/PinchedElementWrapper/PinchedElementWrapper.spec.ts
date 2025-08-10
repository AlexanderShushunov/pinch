import { expect, test, describe, vi, afterEach, beforeEach } from "vitest";

import { PinchedElementWrapper } from "./PinchedElementWrapper.ts";

vi.useFakeTimers();

async function waitNextAnimationFrame() {
    await vi.advanceTimersByTimeAsync(20);
}

function parseTransformMatrix(matrix: string) {
    const regex = /matrix\((?<scaleX>[0-9.-]+),\s*[0-9.-]+,\s*[0-9.-]+,\s*(?<scaleY>[0-9.-]+),\s*(?<translateX>[0-9.-]+),\s*(?<translateY>[0-9.-]+)\)/;
    const matches = matrix.match(regex);

    if (!matches || !matches.groups) {
        return { zoom: 1, translateX: 0, translateY: 0 };
    }

    const { scaleX, translateX, translateY } = matches.groups;

    return {
        zoom: parseFloat(scaleX),
        translateX: parseFloat(translateX),
        translateY: parseFloat(translateY),
    };
}

describe("PinchedElementWrapper", () => {
    let element: HTMLElement;

    beforeEach(() => {
        element = document.createElement("div");
        element.getBoundingClientRect = vi.fn(
            () =>
                ({
                    width: 100,
                    height: 200,
                    top: 0,
                    left: 0,
                    right: 100,
                    bottom: 200,
                } as DOMRect),
        );
        document.body.appendChild(element);
    });

    afterEach(async () => {
        document.body.removeChild(element);
        await vi.runAllTimersAsync();
    });

    test("should provide startSize (size before any transformation)", async () => {
        const wrapper = new PinchedElementWrapper(element, 300);
        expect(wrapper.startSize).toEqual({ width: 100, height: 200 });
        wrapper.transform({
            zoom: 1.5,
            translate: { x: 10, y: 20 },
            withTransition: false,
        });
        await waitNextAnimationFrame();
        expect(wrapper.startSize).toEqual({ width: 100, height: 200 });
    });

    test("should set correct initial styles on element", () => {
        new PinchedElementWrapper(element, 300);

        expect(element.style.position).toBe("relative");
        expect(element.style.transformOrigin).toBe("top left");
    });

    test("should apply only last transform data when multiple calls are made before animation frame", async () => {
        const wrapper = new PinchedElementWrapper(element, 300);

        wrapper.transform({
            zoom: 1.5,
            translate: { x: 10, y: 20 },
            withTransition: false,
        });

        const firstTransform = parseTransformMatrix(element.style.transform);
        expect(firstTransform.zoom).toBe(1);
        expect(firstTransform.translateX).toBe(0);
        expect(firstTransform.translateY).toBe(0);

        wrapper.transform({
            zoom: 2,
            translate: { x: 30, y: 40 },
            withTransition: false,
        });

        await waitNextAnimationFrame();

        const secondTransform = parseTransformMatrix(element.style.transform);
        expect(secondTransform.zoom).toBe(2);
        expect(secondTransform.translateX).toBe(30);
        expect(secondTransform.translateY).toBe(40);
    });

    test("should apply transform on requestAnimationFrame", async () => {
        const wrapper = new PinchedElementWrapper(element, 300);

        wrapper.transform({
            zoom: 1.5,
            translate: { x: 10, y: 20 },
            withTransition: false,
        });

        expect(element.style.transform).toBe("");

        await waitNextAnimationFrame();

        const { zoom, translateX, translateY } = parseTransformMatrix(element.style.transform);
        expect(zoom).toBe(1.5);
        expect(translateX).toBe(10);
        expect(translateY).toBe(20);
    });

    test("should add moveTime transition if withTransition is true", async () => {
        const wrapper = new PinchedElementWrapper(element, 500);

        wrapper.transform({
            zoom: 1.5,
            translate: { x: 10, y: 20 },
            withTransition: true,
        });

        await waitNextAnimationFrame();

        expect(element.style.transition).toBe("transform 0.5s ease");
    });

    test("should remove transition if withTransition is false", async () => {
        const wrapper = new PinchedElementWrapper(element, 300);

        wrapper.transform({
            zoom: 1.5,
            translate: { x: 10, y: 20 },
            withTransition: true,
        });

        await waitNextAnimationFrame();
        expect(element.style.transition).toBe("transform 0.3s ease");

        wrapper.transform({
            zoom: 2,
            translate: { x: 30, y: 40 },
            withTransition: false,
        });

        await waitNextAnimationFrame();
        expect(element.style.transition).toBe("");
    });
});
