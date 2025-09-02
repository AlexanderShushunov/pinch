import { PinchedElementWrapper } from "../PinchedElementWrapper";
import { RawPinchDetector } from "../RawPinchDetector";
import { ResettableFlag } from "../ResettableFlag";
import type { Disposable } from "../Disposable";
import { Notifier } from "../Notifier";

const nonStart = -1;
const zoomThreshold = 0.2;
const shiftThreshold = 10;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export class Pinchable implements Disposable {
    private readonly params: {
        maxZoom: number;
        velocity: number;
        applyTime: number;
    };
    private rawPinchDetector: RawPinchDetector;
    private element: PinchedElementWrapper;
    private disableAfterApply: ResettableFlag;
    private enabled = true;
    private startPinchingNotifier = new Notifier<[]>();
    // change one per pinch
    private center = { x: 0, y: 0 };
    private prevZoom = 1;
    private prevShift = { x: 0, y: 0 };
    // change on each pointer move
    private prevDist = nonStart;
    private removedPinchShift = { x: 0, y: 0 };
    // current position with thresholds
    private shift = { x: 0, y: 0 };
    private zoom = 1;

    public constructor(
        element: HTMLElement,
        params: {
            maxZoom: number;
            velocity: number;
            applyTime: number;
        },
    ) {
        this.params = params;
        this.rawPinchDetector = new RawPinchDetector({
            element: element,
            onStart: this.handleStart,
            onPinch: this.handlePinch,
        });
        this.disableAfterApply = new ResettableFlag(params.applyTime);
        this.element = new PinchedElementWrapper(element, params.applyTime);
    }

    public dispose(): void {
        this.rawPinchDetector.dispose();
        this.disableAfterApply.dispose();
        this.element.dispose();
        this.startPinchingNotifier.dispose();
    }

    /**
     * Programmatically zoom the element to a specific point.
     *
     * @param zoom Optional zoom level to apply.
     * @param to   Target point inside the element. `to.x` and `to.y`
     *             should be normalized between `0` and `1`, representing
     *             a position relative to the element's width and height.
     *             Values outside this range will be clamped.
     */
    public focus({ zoom, to }: { zoom?: number; to: { x: number; y: number } }): void {
        this.disableAfterApply.reset();
        if (zoom !== undefined) {
            this.zoom = zoom;
        }

        const { width, height } = this.element.startSize;

        const normalizedTo = {
            x: clamp(to.x, 0, 1),
            y: clamp(to.y, 0, 1),
        };

        const centerShift = {
            x: width / 2 - normalizedTo.x * width * this.normalizedZoom,
            y: height / 2 - normalizedTo.y * height * this.normalizedZoom,
        };

        this.shift = {
            x: centerShift.x,
            y: centerShift.y,
        };

        this.element.transform({
            zoom: this.normalizedZoom,
            translate: this.normalizedShift,
            withTransition: true,
        });
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    public subscribeToStartPinching(callback: () => void): () => void {
        return this.startPinchingNotifier.subscribe(callback);
    }

    private handleStart = () => {
        this.prevDist = this.rawPinchDetector.distance;
        this.zoom = this.normalizedZoom;
        this.prevZoom = this.normalizedZoom;
        this.shift = this.normalizedShift;
        this.prevShift = this.normalizedShift;
        this.removedPinchShift = { x: 0, y: 0 };
        const center = this.rawPinchDetector.center;
        this.center = {
            x: (center.x - this.shift.x) / this.zoom,
            y: (center.y - this.shift.y) / this.zoom,
        };
        this.startPinchingNotifier.emit();
    };

    private handlePinch = () => {
        if (this.disableAfterApply.value || !this.enabled) {
            return;
        }
        const curDist = this.rawPinchDetector.distance;
        const curShift = this.rawPinchDetector.shift;
        this.zoom = this.calcThresholdZoom(curDist);
        this.shift = this.calculateThresholdShift(curShift);
        this.element.transform({
            zoom: this.normalizedZoom,
            translate: this.normalizedShift,
            withTransition: false,
        });
        this.prevDist = curDist;
    };

    private get normalizedZoom() {
        const { maxZoom } = this.params;
        return clamp(this.zoom, 1, maxZoom);
    }

    private calcThresholdZoom(curDist: number) {
        const { maxZoom, velocity } = this.params;
        const candidate = (this.zoom * curDist) / (curDist + (this.prevDist - curDist) * velocity);
        return clamp(candidate, 1 - zoomThreshold, maxZoom + zoomThreshold);
    }

    private get normalizedShift() {
        const { height, width } = this.element.startSize;
        const { x, y } = this.shift;
        return {
            x: clamp(x, width * (1 - this.normalizedZoom), 0),
            y: clamp(y, height * (1 - this.normalizedZoom), 0),
        };
    }

    private calculateThresholdShift(pinchShift: { x: number; y: number }) {
        const { width, height } = this.element.startSize;
        const deltaZoom = this.normalizedZoom - this.prevZoom;
        const requestedShift = {
            x: this.prevShift.x + pinchShift.x - this.center.x * deltaZoom,
            y: this.prevShift.y + pinchShift.y - this.center.y * deltaZoom,
        };

        const ret = {
            x: clamp(
                requestedShift.x - this.removedPinchShift.x,
                width * (1 - this.normalizedZoom) - shiftThreshold,
                shiftThreshold,
            ),
            y: clamp(
                requestedShift.y - this.removedPinchShift.y,
                height * (1 - this.normalizedZoom) - shiftThreshold,
                shiftThreshold,
            ),
        };

        this.removedPinchShift = {
            x: requestedShift.x - ret.x,
            y: requestedShift.y - ret.y,
        };

        return ret;
    }
}
