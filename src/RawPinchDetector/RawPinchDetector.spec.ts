import userEvent, { type UserEvent } from "@testing-library/user-event";
import { RawPinchDetector } from "./RawPinchDetector.ts";
import { expect, test, describe, vi, afterEach, beforeEach } from "vitest";

vi.useFakeTimers();

describe("RawPinchDetector", () => {
    let element: HTMLElement;
    let detector: RawPinchDetector;
    let events: UserEvent;
    const onStart = vi.fn();
    const onPinch = vi.fn();

    beforeEach(() => {
        element = document.createElement("div");
        document.body.appendChild(element);
        events = userEvent.setup();
        onStart.mockReset();
        onPinch.mockReset();
        detector = new RawPinchDetector({
            element: element,
            onStart: onStart,
            onPinch: onPinch,
        });
    });

    afterEach(async () => {
        document.body.removeChild(element);
        detector.dispose();
        await vi.runAllTimersAsync();
    });

    async function asyncPointer(pointers: Parameters<UserEvent["pointer"]>[0]) {
        const eventResult = events.pointer(pointers);
        await vi.advanceTimersByTimeAsync(5);
        await eventResult;
    }

    test("should set required styles on element", () => {
        expect(element.style.touchAction).toBe("none");
        expect(element.style.position).toBe("relative");
    });

    test("should restore styles on dispose", () => {
        detector.dispose();
        expect(element.style.touchAction).toBe("");
        expect(element.style.position).toBe("");
    });

    test("should restore custom touch-action style", () => {
        const custom = document.createElement("div");
        custom.style.touchAction = "pan-x";
        document.body.appendChild(custom);
        const localDetector = new RawPinchDetector({
            element: custom,
            onStart: vi.fn(),
            onPinch: vi.fn(),
        });
        expect(custom.style.touchAction).toBe("none");
        localDetector.dispose();
        expect(custom.style.touchAction).toBe("pan-x");
        document.body.removeChild(custom);
    });

    test("should restore existing position style", () => {
        const custom = document.createElement("div");
        custom.style.position = "absolute";
        document.body.appendChild(custom);
        const localDetector = new RawPinchDetector({
            element: custom,
            onStart: vi.fn(),
            onPinch: vi.fn(),
        });
        expect(custom.style.position).toBe("absolute");
        localDetector.dispose();
        expect(custom.style.position).toBe("absolute");
        document.body.removeChild(custom);
    });

    test("should invoke onStart callback when user touches screen with two fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { pageX: 100, pageY: 200 } },
            { keys: "[TouchB>]", target: element, coords: { pageX: 300, pageY: 400 } },
        ]);

        expect(onStart).toHaveBeenCalledTimes(1);
    });

    test("should invoke onPinch callback when user moves fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { pageX: 10, pageY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { pageX: 50, pageY: 60 } },
            { pointerName: "TouchA", target: element, coords: { pageX: 30, pageY: 40 } },
        ]);

        expect(onPinch).toHaveBeenCalledTimes(1);
    });

    test("should calc center as a center between start fingers' positions", async () => {
        Object.defineProperty(element, "offsetLeft", { value: 50, configurable: true });
        Object.defineProperty(element, "offsetTop", { value: 100, configurable: true });
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { pageX: 150, pageY: 300 } },
            { keys: "[TouchB>]", target: element, coords: { pageX: 350, pageY: 500 } },
        ]);

        expect(detector.center).toEqual({ x: 200, y: 300 });
    });

    test("should calc distance as a distance between last fingers' positions", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { pageX: 10, pageY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { pageX: 50, pageY: 60 } },
            { pointerName: "TouchA", target: element, coords: { pageX: 30, pageY: 40 } },
            { pointerName: "TouchB", target: element, coords: { pageX: 90, pageY: 100 } },
        ]);

        // Distance should be sqrt((90-30)^2 + (100-40)^2) = sqrt(60^2 + 60^2) = 84.85...
        expect(detector.distance).toBeCloseTo(84.85);
    });

    test("should calculate shift as a shift of the center between fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { pageX: 10, pageY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { pageX: 30, pageY: 40 } },
        ]);
        await asyncPointer([
            { pointerName: "TouchA", target: element, coords: { pageX: 20, pageY: 30 } },
            { pointerName: "TouchA", target: element, coords: { pageX: 50, pageY: 60 } },
        ]);

        expect(detector.shift).toEqual({ x: 20, y: 20 });
    });

    describe(`The user holds the phone with one hand,
                    with one finger already touching the screen.
                    When they pinch with the other hand,
                    the detector should handle only second hand pinching`, () => {
        beforeEach(async () => {
            await asyncPointer([{ keys: "[TouchA>]", target: element, coords: { pageX: 500, pageY: 500 } }]);
        });

        test("should invoke onStart callback when user touches screen with thread fingers", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { pageX: 100, pageY: 200 } },
                { keys: "[TouchC>]", target: element, coords: { pageX: 300, pageY: 400 } },
            ]);

            expect(onStart).toHaveBeenCalledTimes(2);
        });

        test("should handle two latest fingers as a 'pinching source'", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { pageX: 40, pageY: 40 } },
                { keys: "[TouchC>]", target: element, coords: { pageX: 80, pageY: 80 } },
                { pointerName: "TouchB", target: element, coords: { pageX: 60, pageY: 60 } },
                { pointerName: "TouchC", target: element, coords: { pageX: 100, pageY: 100 } },
            ]);

            expect(detector.center).toEqual({ x: 60, y: 60 });
            expect(detector.distance).toBeCloseTo(56.57);
            expect(detector.shift).toEqual({ x: 20, y: 20 });
        });

        describe(`Prevent unexpected pinching when the user
                 lifts two fingers one by one.
                 Unfortunately, they sometimes do this sequentially.
                 The detector should NOT handle pinching between
                 the first finger on the first hand and
                 the first finger on the second hand.`, () => {
            test("should disable move processing for a short time after finger up", async () => {
                await asyncPointer([
                    { keys: "[TouchB>]", target: element, coords: { pageX: 40, pageY: 40 } },
                    { keys: "[TouchC>]", target: element, coords: { pageX: 80, pageY: 80 } },
                    { pointerName: "TouchC", target: element, coords: { pageX: 90, pageY: 90 } },
                ]);
                await asyncPointer([{ keys: "[/TouchC]" }]);

                onPinch.mockClear();

                await asyncPointer([{ pointerName: "TouchB", target: element, coords: { pageX: 20, pageY: 20 } }]);

                expect(onPinch).not.toHaveBeenCalled();
            });

            test("should enable move processing for 100 ms after finger up", async () => {
                await asyncPointer([
                    { keys: "[TouchB>]", target: element, coords: { pageX: 40, pageY: 40 } },
                    { keys: "[TouchC>]", target: element, coords: { pageX: 80, pageY: 80 } },
                    { pointerName: "TouchC", target: element, coords: { pageX: 90, pageY: 90 } },
                ]);
                await asyncPointer([{ keys: "[/TouchC]" }]);

                onPinch.mockClear();
                await vi.advanceTimersByTimeAsync(100);

                await asyncPointer([{ pointerName: "TouchB", target: element, coords: { pageX: 20, pageY: 20 } }]);

                expect(onPinch).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("dispose", () => {
        test("should clean up event listeners on dispose", () => {
            const addListenerSpy = vi.spyOn(element, "addEventListener");
            const removeListenerSpy = vi.spyOn(element, "removeEventListener");
            new RawPinchDetector({
                element: element,
                onStart: onStart,
                onPinch: onPinch,
            }).dispose();
            expect(addListenerSpy.mock.calls).toEqual(removeListenerSpy.mock.calls);
            addListenerSpy.mockRestore();
            removeListenerSpy.mockRestore();
        });

        test("should clear disableAfterUp timer on dispose", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { pageX: 40, pageY: 40 } },
                { keys: "[TouchC>]", target: element, coords: { pageX: 80, pageY: 80 } },
            ]);
            await asyncPointer([{ keys: "[/TouchC]" }]);
            expect(vi.getTimerCount()).toBe(1);
            detector.dispose();
            expect(vi.getTimerCount()).toBe(0);
        });
    });
});
