import { ResettableFlag } from "../ResettableFlag";
import type { Disposable } from "../Disposable";

function withId(id: number) {
    return (pointer: PointerEvent) => pointer.pointerId === id;
}

export class RawPinchDetector implements Disposable {
    private readonly element: HTMLElement;
    private readonly onStart: () => void;
    private readonly onPinch: () => void;
    private readonly activePointers: PointerEvent[] = [];
    private readonly startPointers: PointerEvent[] = [];
    private readonly disableAfterUp = new ResettableFlag(100);

    public constructor(params: {
        element: HTMLElement;
        onStart: () => void;
        onPinch: () => void;
    }) {
        this.element = params.element;
        this.onStart = params.onStart;
        this.onPinch = params.onPinch;
        this.element.addEventListener("pointerdown", this.handleDown);
        this.element.addEventListener("pointermove", this.handleMove);
        this.element.addEventListener("pointerup", this.handleUp);
        this.element.addEventListener("pointercancel", this.handleUp);
        this.element.addEventListener("pointerout", this.handleUp);
        this.element.addEventListener("pointerleave", this.handleUp);
    }

    public dispose(): void {
        this.element.removeEventListener("pointerdown", this.handleDown);
        this.element.removeEventListener("pointermove", this.handleMove);
        this.element.removeEventListener("pointerup", this.handleUp);
        this.element.removeEventListener("pointercancel", this.handleUp);
        this.element.removeEventListener("pointerout", this.handleUp);
        this.element.removeEventListener("pointerleave", this.handleUp);
        this.disableAfterUp.dispose();
    }

    public get isPinch(): boolean {
        return this.activePointers.length >= 2;
    }

    public get center(): { x: number; y: number; } {
        if (!this.isPinch) {
            return { x: 0, y: 0 };
        }
        const firstStart = this.startPointers[this.firstIndex];
        const secondStart = this.startPointers[this.secondIndex];
        return {
            x: (firstStart.offsetX + secondStart.offsetX) / 2,
            y: (firstStart.offsetY + secondStart.offsetY) / 2,
        };
    }

    public get distance(): number {
        if (!this.isPinch) {
            return 0;
        }
        const first = this.activePointers[this.firstIndex];
        const second = this.activePointers[this.secondIndex];
        return Math.hypot(first.offsetX - second.offsetX, first.offsetY - second.offsetY);
    }

    public get shift(): { x: number; y: number; } {
        if (!this.isPinch) {
            return { x: 0, y: 0 };
        }
        const first = this.activePointers[this.firstIndex];
        const second = this.activePointers[this.secondIndex];
        const firstStart = this.startPointers[this.firstIndex];
        const secondStart = this.startPointers[this.secondIndex];
        return {
            x: (first.offsetX - firstStart.offsetX + second.offsetX - secondStart.offsetX) / 2,
            y: (first.offsetY - firstStart.offsetY + second.offsetY - secondStart.offsetY) / 2,
        };
    }

    private handleDown = (event: PointerEvent) => {
        this.activePointers.push(event);
        this.startPointers.push(event);
        if (this.isPinch) {
            this.onStart();
        }
    };

    private handleMove = (event: PointerEvent) => {
        if (this.disableAfterUp.value) {
            return;
        }
        const index = this.activePointers.findIndex(withId(event.pointerId));
        if (index !== -1) {
            this.activePointers[index] = event;
        }
        if (this.isPinch) {
            this.onPinch();
        }
    };

    private handleUp = (event: PointerEvent) => {
        const index = this.activePointers.findIndex(withId(event.pointerId));
        if (index !== -1) {
            this.activePointers.splice(index, 1);
            this.startPointers.splice(index, 1);
        }
        this.disableAfterUp.reset();
    };

    private get firstIndex(): number {
        return this.activePointers.length - 1;
    }

    private get secondIndex(): number {
        return this.activePointers.length - 2;
    }
}
