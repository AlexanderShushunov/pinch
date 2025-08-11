import type { Disposable } from "../Disposable";

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

    public reset(): void {
        this._value = true;

        if (this.resetTimeout !== null) {
            window.clearTimeout(this.resetTimeout);
        }

        this.resetTimeout = window.setTimeout(() => {
            this._value = false;
        }, this.resetDuration);
    }

    public dispose(): void {
        if (this.resetTimeout !== null) {
            window.clearTimeout(this.resetTimeout);
        }
        this._value = false;
    }
}
