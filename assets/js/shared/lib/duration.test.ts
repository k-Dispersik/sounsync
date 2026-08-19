import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";

describe("formatDuration", () => {
    it("D-24: milliseconds are shown as minutes and seconds, not as seconds", () => {
        expect(formatDuration(8_000)).toBe("0:08");
        expect(formatDuration(60_000)).toBe("1:00");
        expect(formatDuration(95_500)).toBe("1:36");
    });

    it("adds hours only when there are any", () => {
        expect(formatDuration(3_599_000)).toBe("59:59");
        expect(formatDuration(3_600_000)).toBe("1:00:00");
        expect(formatDuration(3_725_000)).toBe("1:02:05");
    });

    it("shows a dash when the duration is unknown", () => {
        expect(formatDuration(null)).toBe("—");
        expect(formatDuration(undefined)).toBe("—");
        expect(formatDuration(Number.NaN)).toBe("—");
        expect(formatDuration(-1)).toBe("—");
    });

    it("zero is a duration, not a missing value", () => {
        expect(formatDuration(0)).toBe("0:00");
    });
});
