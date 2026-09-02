import { describe, expect, it } from "vitest";

import {
    beatDurationMs,
    beatsToMs,
    contextTimeOf,
    millisecondsPerBeat,
    msToBeats,
    parseTimeSignature,
    timelineMsOf,
} from "./clock";

describe("the time map", () => {
    const map = { contextStartedAt: 10, startedFromMs: 2_000 };

    it("puts the start of playback at the moment it started", () => {
        expect(contextTimeOf(2_000, map)).toBe(10);
    });

    it("a second of timeline is a second of context", () => {
        expect(contextTimeOf(3_000, map)).toBe(11);
    });

    it("reads back the other way", () => {
        expect(timelineMsOf(11, map)).toBe(3_000);
    });

    it("round-trips at the boundaries", () => {
        for (const ms of [0, 1, 999, 60_000, 3_600_000]) {
            expect(timelineMsOf(contextTimeOf(ms, map), map)).toBeCloseTo(ms, 6);
        }
    });

    it("a sound before the start point is scheduled in the past", () => {
        // The player refuses to schedule these; the arithmetic still holds.
        expect(contextTimeOf(0, map)).toBe(8);
    });
});

describe("tempo", () => {
    it("120 bpm is half a second a beat", () => {
        expect(millisecondsPerBeat(120)).toBe(500);
    });

    it.each([
        [20, 3_000],
        [60, 1_000],
        [128, 468.75],
        [300, 200],
    ])("%i bpm is %f ms per beat", (bpm, expected) => {
        expect(millisecondsPerBeat(bpm)).toBeCloseTo(expected, 6);
    });
});

describe("time signatures", () => {
    it("reads the usual ones", () => {
        expect(parseTimeSignature("4/4")).toEqual({ beatsPerBar: 4, beatUnit: 4 });
        expect(parseTimeSignature("7/8")).toEqual({ beatsPerBar: 7, beatUnit: 8 });
        expect(parseTimeSignature("3/2")).toEqual({ beatsPerBar: 3, beatUnit: 2 });
    });

    it("falls back to common time rather than throwing", () => {
        expect(parseTimeSignature(undefined)).toEqual({ beatsPerBar: 4, beatUnit: 4 });
        expect(parseTimeSignature("nonsense")).toEqual({ beatsPerBar: 4, beatUnit: 4 });
        expect(parseTimeSignature("0/0")).toEqual({ beatsPerBar: 4, beatUnit: 4 });
    });

    it("an eighth-note beat is half a quarter-note beat", () => {
        expect(beatDurationMs(120, "4/4")).toBe(500);
        expect(beatDurationMs(120, "7/8")).toBe(250);
        expect(beatDurationMs(120, "3/2")).toBe(1_000);
    });

    it("converts between beats and milliseconds both ways", () => {
        for (const [bpm, signature] of [
            [120, "4/4"],
            [90, "3/4"],
            [140, "7/8"],
            [20, "4/4"],
            [300, "12/8"],
        ] as const) {
            for (const ms of [0, 1, 999, 60_000, 3_600_000]) {
                expect(beatsToMs(msToBeats(ms, bpm, signature), bpm, signature)).toBeCloseTo(ms, 6);
            }
        }
    });
});
