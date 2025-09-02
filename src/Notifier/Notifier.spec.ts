import { describe, it, expect, vi } from "vitest";

import { Notifier } from "./Notifier.ts";

describe("Notifier", () => {
    it("notifies subscribed callbacks", () => {
        const notifier = new Notifier<[number]>();
        const cb = vi.fn();
        notifier.subscribe(cb);
        notifier.emit(42);
        expect(cb).toHaveBeenCalledWith(42);
    });

    it("unsubscribes callbacks", () => {
        const notifier = new Notifier<[]>();
        const cb = vi.fn();
        const unsubscribe = notifier.subscribe(cb);
        unsubscribe();
        notifier.emit();
        expect(cb).not.toHaveBeenCalled();
    });

    it("clears callbacks on dispose", () => {
        const notifier = new Notifier<[]>();
        const cb = vi.fn();
        notifier.subscribe(cb);
        notifier.dispose();
        notifier.emit();
        expect(cb).not.toHaveBeenCalled();
    });
});
