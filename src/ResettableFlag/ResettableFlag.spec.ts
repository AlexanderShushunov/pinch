import { expect, test, describe, vi, afterEach } from "vitest";

import { ResettableFlag } from "./ResettableFlag.ts";

vi.useFakeTimers();

describe("ResettableFlag", () => {
    afterEach(async () => {
        await vi.runAllTimersAsync();
    });

    test("should have value=false by default", () => {
        const flag = new ResettableFlag();
        expect(flag.value).toBe(false);
    });

    test("should set value to false when reset", () => {
        const flag = new ResettableFlag();
        flag.reset();
        expect(flag.value).toBe(true);
    });

    test("should set value back to true after the duration", () => {
        const duration = 500;
        const flag = new ResettableFlag(duration);

        flag.reset();
        expect(flag.value).toBe(true);

        vi.advanceTimersByTime(duration - 10);
        expect(flag.value).toBe(true);

        vi.advanceTimersByTime(20);
        expect(flag.value).toBe(false);
    });

    test("should restart timer when reset is called again", () => {
        const duration = 1000;
        const flag = new ResettableFlag(duration);

        flag.reset();
        expect(flag.value).toBe(true);

        vi.advanceTimersByTime(500);
        expect(flag.value).toBe(true);

        flag.reset();
        vi.advanceTimersByTime(500);
        expect(flag.value).toBe(true);

        vi.advanceTimersByTime(600);
        expect(flag.value).toBe(false);
    });

    test("should clear timeout when disposed", () => {
        const flag = new ResettableFlag();

        flag.reset();
        flag.dispose();

        expect(vi.getTimerCount()).toBe(0);
    });
});
