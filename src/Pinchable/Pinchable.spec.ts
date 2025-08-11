import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

import { PinchedElementWrapper } from "../PinchedElementWrapper";
import { RawPinchDetector } from "../RawPinchDetector";
import { Pinchable } from "./Pinchable.ts";

vi.mock("../RawPinchDetector/index.ts");
vi.mock("../PinchedElementWrapper/index.ts");

const RawPinchDetectorMock = vi.mocked(RawPinchDetector);
const PinchedElementWrapperMock = vi.mocked(PinchedElementWrapper);

function getRawDetectorInstance() {
    return RawPinchDetectorMock.mock.results[0].value;
}

function getPinchedElementWrapperInstance() {
    return PinchedElementWrapperMock.mock.results[0].value;
}

vi.useFakeTimers();

describe("Pinch", () => {
    let shift = { x: 0, y: 0 };
    let distance = 0;
    let center = { x: 0, y: 0 };
    const startSize = { width: 300, height: 200 };

    beforeEach(() => {
        shift = { x: 0, y: 0 };
        distance = 0;
        center = { x: 0, y: 0 };
        const startSize = { width: 300, height: 200 };
        RawPinchDetectorMock.mockClear().mockImplementation(
            () =>
                ({
                    get center() {
                        return center;
                    },
                    get distance() {
                        return distance;
                    },
                    get shift() {
                        return shift;
                    },
                    dispose: vi.fn(),
                }) as unknown as RawPinchDetector,
        );

        PinchedElementWrapperMock.mockReset().mockImplementation(
            () =>
                ({
                    get startSize() {
                        return startSize;
                    },
                    transform: vi.fn(),
                    dispose: vi.fn(),
                }) as unknown as PinchedElementWrapper,
        );
    });

    function createPinch(params: Partial<ConstructorParameters<typeof Pinchable>[1]> = {}) {
        const defaultParams = {
            maxZoom: 3,
            velocity: 1,
            applyTime: 300,
        };
        const element = document.createElement("div");
        const pinchable = new Pinchable(element, { ...defaultParams, ...params });

        const onPinch = RawPinchDetectorMock.mock.calls[0][0].onPinch;
        const onStart = RawPinchDetectorMock.mock.calls[0][0].onStart;

        return {
            pinchable: pinchable,
            start(val: { center: { x: number; y: number }; distance: number }) {
                center = val.center;
                distance = val.distance;
                onStart();
            },
            move(val: { distance?: number; shift?: { x: number; y: number } }) {
                distance = val.distance ?? distance;
                shift = val.shift ?? shift;
                onPinch();
            },
        };
    }

    function getLastTransform() {
        const elemWrapper = getPinchedElementWrapperInstance();
        const transformCalls = elemWrapper.transform.mock.calls;
        return transformCalls[transformCalls.length - 1][0];
    }

    afterEach(async () => {
        await vi.runAllTimersAsync();
    });

    describe("zoom (the center between the fingers should maintain its position)", () => {
        beforeEach(() => {
            shift = { x: 0, y: 0 };
        });
        test("simple pinch zoom", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -40, y: -40 },
                withTransition: false,
            });
        });

        test("simple pinch zoom (sequence of movement)", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 70,
            });
            pinch.move({
                distance: 100,
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -40, y: -40 },
                withTransition: false,
            });
        });

        test("simple pinch zoom (return to start position)", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                distance: 50,
            });
            expect(getLastTransform()).toEqual({
                zoom: 1,
                translate: { x: 0, y: 0 },
                withTransition: false,
            });
        });

        test("sequence of pinching in different place", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 75,
            });
            pinch.start({
                center: { x: 100, y: 20 },
                distance: 30,
            });
            pinch.move({
                distance: 45,
            });

            expect(getLastTransform()).toEqual({
                zoom: 2.25,
                translate: { x: -80, y: -40 },
                withTransition: false,
            });
        });

        test("zoom can not be bigger then maxZoom", () => {
            const pinch = createPinch({ maxZoom: 2 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 150,
            });

            expect(getLastTransform().zoom).toEqual(2);
        });

        test("zoom can not be smaller then 1", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                distance: 30,
            });
            expect(getLastTransform().zoom).toEqual(1);
        });

        test("should change zoom with passed velocity", () => {
            const pinch = createPinch({ velocity: 0.5 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 150,
            });

            expect(getLastTransform().zoom).toEqual(1.5);
        });

        test(`The player zooms to maxZoom, but the fingers are slightly farther apart
             than needed for maxZoom. When both fingers are lifted, users often can't do it precisely.
             So just before the fingers are lifted, they moves slightly and the distance between the fingers
             becomes smaller. In this case, the zoom should still be set to maxZoom.`, () => {
            const pinch = createPinch({ maxZoom: 2 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 110,
            });
            expect(getLastTransform().zoom).toEqual(2);
            pinch.move({
                distance: 105,
            });
            expect(getLastTransform().zoom).toEqual(2);
        });

        test(`The player zooms to maxZoom, but the fingers are significantly farther apart
             than needed for maxZoom. When the user wants to decrease the zoom,
             it should start decreasing with small finger movements.`, () => {
            const pinch = createPinch({ maxZoom: 2 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 200,
            });
            expect(getLastTransform().zoom).toEqual(2);
            pinch.move({
                distance: 185, // small threshold
            });
            expect(getLastTransform().zoom).toEqual(2);
            pinch.move({
                distance: 180, // it is much bigger than 100 = 2 (maxZoom) * 50 (start distance)
            });
            expect(getLastTransform().zoom).toEqual(1.98);
        });

        test("during zooming left/top position of element can be more 0", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 10, y: 10 },
                distance: 50,
            });
            pinch.move({
                distance: 200,
            });
            pinch.start({
                center: { x: 250, y: 150 },
                distance: 100,
            });
            pinch.move({
                distance: 85,
            });
            expect(getLastTransform().zoom).toBeGreaterThan(1);
            expect(getLastTransform().translate).toEqual({ x: 0, y: 0 });
        });

        test("during zooming bottom/right position of element can be more start size of element", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 250, y: 150 },
                distance: 50,
            });
            pinch.move({
                distance: 200,
            });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 100,
            });
            pinch.move({
                distance: 50,
            });
            expect(getLastTransform().zoom).toEqual(1.5);
            expect(getLastTransform().translate).toEqual({
                x: -(startSize.width * 0.5),
                y: -(startSize.height * 0.5),
            });
        });
    });

    describe("shift", () => {
        test("simple shift", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: 20, y: 20 },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -20, y: -20 },
                withTransition: false,
            });
        });

        test("simple shift (sequence of movement)", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: 20, y: -10 },
            });
            pinch.move({
                shift: { x: -20, y: 10 },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -60, y: -30 },
                withTransition: false,
            });
        });

        test("simple shift (return to start position)", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: 30, y: -30 },
            });
            pinch.move({
                shift: { x: 0, y: 0 },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -40, y: -40 },
                withTransition: false,
            });
        });

        test("sequence of moving in different place", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: -15, y: 20 },
            });
            pinch.start({
                center: { x: 100, y: 20 },
                distance: 30,
            });
            pinch.move({
                shift: { x: 40, y: 10 },
            });

            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -15, y: -10 },
                withTransition: false,
            });
        });

        test("during shifting left/top position of element can be more 0", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: 100, y: 100 },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: 0, y: 0 },
                withTransition: false,
            });
        });

        test("during shifting bottom/right position of element can be more start size of element", () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 300,
            });
            pinch.move({
                shift: { x: -800, y: -800 },
            });
            expect(getLastTransform().translate).toEqual({ x: -600, y: -400 });
        });

        test(`The player shifts to the edge, but the fingers are slightly farther apart than needed to get it.
              When both fingers are lifted, users often can't do it precisely. So just before the fingers are lifted,
              they move slightly and the fingers shift to the back direction.
              In this case, the shift should still be set the same.`, () => {
            const pinch = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinch.move({
                shift: { x: 45, y: 45 },
            });
            pinch.move({
                shift: { x: 43, y: 43 },
            });
            expect(getLastTransform().translate).toEqual({ x: 0, y: 0 });
        });

        test(`The player shifts to the edge, but the fingers are significantly farther apart
             than needed to get it. When the user wants to move it in the back direction,
             it should start moving (10 px) with small finger movements.`, () => {
            const pinch = createPinch({ maxZoom: 2 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 200,
            });
            pinch.move({
                shift: { x: 300, y: 300 },
            });
            expect(getLastTransform().translate).toEqual({ x: 0, y: 0 });
            pinch.move({
                shift: { x: 290, y: 290 },
            });
            expect(getLastTransform().translate).toEqual({ x: 0, y: 0 });
            pinch.move({
                shift: { x: 285, y: 285 },
            });
            expect(getLastTransform().translate).toEqual({ x: -5, y: -5 });
        });
    });

    describe("focus", () => {
        test("should 'focus' the element with transition", () => {
            const { pinchable, ...pinch } = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinchable.focus({
                zoom: 1.5,
                to: {
                    x: 0.5,
                    y: 0.5,
                },
            });
            expect(getLastTransform()).toEqual({
                zoom: 1.5,
                translate: { x: -75, y: -50 },
                withTransition: true,
            });
        });

        test("should preserve focus if it is not provided", () => {
            const { pinchable, ...pinch } = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinchable.focus({
                to: {
                    x: 0.3,
                    y: 0.3,
                },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -30, y: -20 },
                withTransition: true,
            });
        });

        test("should 'focus' element even it is disable", () => {
            const { pinchable, ...pinch } = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinchable.setEnabled(false);
            pinchable.focus({
                to: {
                    x: 0.9,
                    y: 0.9,
                },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: -300, y: -200 },
                withTransition: true,
            });
        });

        test("should disable manual pitching during apply time", async () => {
            const { pinchable, ...pinch } = createPinch({ applyTime: 500 });
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinchable.focus({
                to: {
                    x: 0.5,
                    y: 0.5,
                },
            });
            await vi.advanceTimersByTimeAsync(300);
            expect(getLastTransform().zoom).toEqual(2);
            pinch.move({
                distance: 300,
            });
            expect(getLastTransform().zoom).toEqual(2);
            await vi.advanceTimersByTimeAsync(200);
            pinch.move({
                distance: 300,
            });
            expect(getLastTransform().zoom).toEqual(3);
        });

        test("during applying left/top position of element can be more 0", () => {
            const { pinchable, ...pinch } = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 100,
            });
            pinchable.focus({
                to: {
                    x: 0.1,
                    y: 0.1,
                },
            });
            expect(getLastTransform().translate).toEqual({ x: 0, y: 0 });
        });

        test("during applying bottom/right position of element can be more start size of element", () => {
            const { pinchable, ...pinch } = createPinch();
            pinch.start({
                center: { x: 40, y: 40 },
                distance: 50,
            });
            pinch.move({
                distance: 200,
            });
            pinchable.focus({
                to: {
                    x: 0.9,
                    y: 0.9,
                },
            });
            expect(getLastTransform().translate).toEqual({
                x: -600,
                y: -400,
            });
        });

        test("should clamp focus coordinates to element bounds", () => {
            const { pinchable } = createPinch();
            pinchable.focus({
                zoom: 2,
                to: { x: -0.5, y: 1.5 },
            });
            expect(getLastTransform()).toEqual({
                zoom: 2,
                translate: { x: 0, y: -200 },
                withTransition: true,
            });
        });
    });

    describe("subscribeToStartPinching", () => {
        test("calls callback on start", () => {
            const { pinchable, start } = createPinch();
            const cb = vi.fn();
            pinchable.subscribeToStartPinching(cb);
            start({ center: { x: 40, y: 40 }, distance: 50 });
            expect(cb).toHaveBeenCalledTimes(1);
            start({ center: { x: 60, y: 60 }, distance: 70 });
            expect(cb).toHaveBeenCalledTimes(2);
        });

        test("unsubscribe removes callback", () => {
            const { pinchable, start } = createPinch();
            const cb = vi.fn();
            const unsubscribe = pinchable.subscribeToStartPinching(cb);
            start({ center: { x: 40, y: 40 }, distance: 50 });
            expect(cb).toHaveBeenCalledTimes(1);
            unsubscribe();
            start({ center: { x: 80, y: 80 }, distance: 90 });
            expect(cb).toHaveBeenCalledTimes(1);
        });

        test("dispose removes callback", () => {
            const { pinchable, start } = createPinch();
            const cb = vi.fn();
            pinchable.subscribeToStartPinching(cb);
            start({ center: { x: 40, y: 40 }, distance: 50 });
            expect(cb).toHaveBeenCalledTimes(1);
            pinchable.dispose();
            start({ center: { x: 80, y: 80 }, distance: 90 });
            expect(cb).toHaveBeenCalledTimes(1);
        });
    });

    test("should not allow manual pinch when disabled", () => {
        const { pinchable, ...pinch } = createPinch();
        pinch.start({
            center: { x: 40, y: 40 },
            distance: 50,
        });
        pinch.move({
            distance: 100,
        });
        expect(getLastTransform()).toEqual({
            zoom: 2,
            translate: { x: -40, y: -40 },
            withTransition: false,
        });
        pinchable.setEnabled(false);
        pinch.move({
            distance: 200,
            shift: { x: 10, y: -90 },
        });
        expect(getLastTransform()).toEqual({
            zoom: 2,
            translate: { x: -40, y: -40 },
            withTransition: false,
        });
    });

    test("should dispose PinchedElementWrapper and RawPinchDetector on dispose", () => {
        const { pinchable } = createPinch();
        pinchable.dispose();

        expect(getRawDetectorInstance().dispose).toHaveBeenCalled();
        expect(getPinchedElementWrapperInstance().dispose).toHaveBeenCalled();
    });

    test("should dispose after apply daily", () => {
        const { pinchable } = createPinch();
        pinchable.focus({
            to: {
                x: 0.5,
                y: 0.5,
            },
        });
        expect(vi.getTimerCount()).toBe(1);

        pinchable.dispose();

        expect(vi.getTimerCount()).toBe(0);
    });
});
