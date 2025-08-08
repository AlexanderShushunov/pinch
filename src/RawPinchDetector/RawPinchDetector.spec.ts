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

    test("should invoke onStart callback when user touches screen with two fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { offsetX: 100, offsetY: 200 } },
            { keys: "[TouchB>]", target: element, coords: { offsetX: 300, offsetY: 400 } },
        ]);

        expect(onStart).toHaveBeenCalledTimes(1);
    });

    test("should invoke onPinch callback when user moves fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { offsetX: 10, offsetY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { offsetX: 50, offsetY: 60 } },
            { pointerName: "TouchA", target: element, coords: { offsetX: 30, offsetY: 40 } },
        ]);

        expect(onPinch).toHaveBeenCalledTimes(1);
    });

    test("should calc center as a center between start fingers' positions", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { offsetX: 100, offsetY: 200 } },
            { keys: "[TouchB>]", target: element, coords: { offsetX: 300, offsetY: 400 } },
        ]);

        expect(detector.center).toEqual({ x: 200, y: 300 });
    });

    test("should calc distance as a distance between last fingers' positions", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { offsetX: 10, offsetY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { offsetX: 50, offsetY: 60 } },
            { pointerName: "TouchA", target: element, coords: { offsetX: 30, offsetY: 40 } },
            { pointerName: "TouchB", target: element, coords: { offsetX: 90, offsetY: 100 } },
        ]);

        // Distance should be sqrt((90-30)^2 + (100-40)^2) = sqrt(60^2 + 60^2) = 84.85...
        expect(detector.distance).toBeCloseTo(84.85);
    });

    test("should calculate shift as a shift of the center between fingers", async () => {
        await asyncPointer([
            { keys: "[TouchA>]", target: element, coords: { offsetX: 10, offsetY: 20 } },
            { keys: "[TouchB>]", target: element, coords: { offsetX: 30, offsetY: 40 } },
        ]);
        await asyncPointer([
            { pointerName: "TouchA", target: element, coords: { offsetX: 20, offsetY: 30 } },
            { pointerName: "TouchA", target: element, coords: { offsetX: 50, offsetY: 60 } },
        ]);

        expect(detector.shift).toEqual({ x: 20, y: 20 });
    });

    describe(`The user holds the phone with one hand,
                    with one finger already touching the screen.
                    When they pinch with the other hand,
                    the detector should handle only second hand pinching`, () => {
        beforeEach(async () => {
            await asyncPointer([
                { keys: "[TouchA>]", target: element, coords: { offsetX: 500, offsetY: 500 } },
            ]);
        });

        test("should invoke onStart callback when user touches screen with thread fingers", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { offsetX: 100, offsetY: 200 } },
                { keys: "[TouchC>]", target: element, coords: { offsetX: 300, offsetY: 400 } },
            ]);

            expect(onStart).toHaveBeenCalledTimes(2);
        });

        test("should handle two latest fingers as a 'pinching source'", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { offsetX: 40, offsetY: 40 } },
                { keys: "[TouchC>]", target: element, coords: { offsetX: 80, offsetY: 80 } },
                { pointerName: "TouchB", target: element, coords: { offsetX: 60, offsetY: 60 } },
                { pointerName: "TouchC", target: element, coords: { offsetX: 100, offsetY: 100 } },
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
                    { keys: "[TouchB>]", target: element, coords: { offsetX: 40, offsetY: 40 } },
                    { keys: "[TouchC>]", target: element, coords: { offsetX: 80, offsetY: 80 } },
                    { pointerName: "TouchC", target: element, coords: { offsetX: 90, offsetY: 90 } },
                ]);
                await asyncPointer([
                    { keys: "[/TouchC]" },
                ]);

                onPinch.mockClear();

                await asyncPointer([
                    { pointerName: "TouchB", target: element, coords: { offsetX: 20, offsetY: 20 } },
                ]);

                expect(onPinch).not.toHaveBeenCalled();
            });

            test("should enable move processing for 100 ms after finger up", async () => {
                await asyncPointer([
                    { keys: "[TouchB>]", target: element, coords: { offsetX: 40, offsetY: 40 } },
                    { keys: "[TouchC>]", target: element, coords: { offsetX: 80, offsetY: 80 } },
                    { pointerName: "TouchC", target: element, coords: { offsetX: 90, offsetY: 90 } },
                ]);
                await asyncPointer([
                    { keys: "[/TouchC]" },
                ]);

                onPinch.mockClear();
                await vi.advanceTimersByTimeAsync(100);

                await asyncPointer([
                    { pointerName: "TouchB", target: element, coords: { offsetX: 20, offsetY: 20 } },
                ]);

                expect(onPinch).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("dispose", () => {
        test("should clean up event listeners on dispose", () => {
            const addListenerSpy = vi.spyOn(element, "addEventListener");
            const removeListenerSpy = vi.spyOn(element, "removeEventListener");
            (new RawPinchDetector({
                element: element,
                onStart: onStart,
                onPinch: onPinch,
            })).dispose();
            expect(addListenerSpy.mock.calls).toEqual(removeListenerSpy.mock.calls);
            addListenerSpy.mockRestore();
            removeListenerSpy.mockRestore();
        });

        test("should clear disableAfterUp timer on dispose", async () => {
            await asyncPointer([
                { keys: "[TouchB>]", target: element, coords: { offsetX: 40, offsetY: 40 } },
                { keys: "[TouchC>]", target: element, coords: { offsetX: 80, offsetY: 80 } },
            ]);
            await asyncPointer([
                { keys: "[/TouchC]" },
            ]);
            expect(vi.getTimerCount()).toBe(1);
            detector.dispose();
            expect(vi.getTimerCount()).toBe(0);
        });
    });
});
