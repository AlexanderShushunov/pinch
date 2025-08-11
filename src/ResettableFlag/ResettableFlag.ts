import type { Disposable } from "../Disposable";

/**
 * Boolean flag that becomes `true` when {@link reset} is invoked and
 * automatically reverts to `false` after the configured timeout.
 */
export class ResettableFlag implements Disposable {
    private _value = false;
    private resetTimeout: number | null = null;
    private readonly resetDuration: number;

    public constructor(resetDuration = 400) {
        this.resetDuration = resetDuration;
    }

    public get value(): boolean {
        return this._value;
    }

    /**
     * Sets the flag `true` for the reset window, then back to `false`.
     */
    public reset(): void {
        this._value = true; // begin reset window

        if (this.resetTimeout !== null) {
            window.clearTimeout(this.resetTimeout);
        }

        this.resetTimeout = window.setTimeout(() => {
            this._value = false; // end reset window
        }, this.resetDuration);
    }

    public dispose(): void {
        if (this.resetTimeout !== null) {
            window.clearTimeout(this.resetTimeout);
        }
        this._value = false;
    }
}
