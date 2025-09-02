import type { Disposable } from "../Disposable";

export class Notifier<Args extends unknown[]> implements Disposable {
    private callbacks = new Set<(...args: Args) => void>();

    public subscribe(callback: (...args: Args) => void): () => void {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }

    public emit(...args: Args): void {
        this.callbacks.forEach((cb) => {
            cb(...args);
        });
    }

    public dispose(): void {
        this.callbacks.clear();
    }
}
