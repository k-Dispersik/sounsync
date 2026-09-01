import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { debounce, throttle } from "./rate";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("throttle", () => {
    it("lets the first call straight through", () => {
        const fn = vi.fn();

        throttle(fn, 33)("first");

        expect(fn).toHaveBeenCalledWith("first");
    });

    it("P-2: a burst becomes a handful of calls", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 33);

        // A 120 Hz mouse for half a second.
        for (let index = 0; index < 60; index++) {
            throttled(index);
            vi.advanceTimersByTime(8);
        }

        expect(fn.mock.calls.length).toBeLessThan(20);
        expect(fn.mock.calls.length).toBeGreaterThan(5);
    });

    it("delivers the most recent value, not the one that happened to fit", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled("first");
        throttled("second");
        throttled("third");
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenLastCalledWith("third");
    });

    it("flush sends what is waiting straight away", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled("first");
        throttled("last");
        throttled.flush();

        expect(fn).toHaveBeenLastCalledWith("last");
    });

    it("flush with nothing pending does nothing", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled("only");
        throttled.flush();
        throttled.flush();

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("cancel drops what was waiting", () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled("first");
        throttled("dropped");
        throttled.cancel();
        vi.advanceTimersByTime(500);

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe("debounce", () => {
    it("P-3: typing sends one request, not one per keystroke", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 400);

        for (const bpm of [1, 12, 128]) {
            debounced(bpm);
            vi.advanceTimersByTime(100);
        }

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(400);

        expect(fn).toHaveBeenCalledExactlyOnceWith(128);
    });

    it("cancel means it never fires", () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 400);

        debounced("dropped");
        debounced.cancel();
        vi.advanceTimersByTime(1_000);

        expect(fn).not.toHaveBeenCalled();
    });
});
