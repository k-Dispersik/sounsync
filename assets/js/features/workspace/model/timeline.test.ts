import { describe, expect, it } from "vitest";

import {
    beatWidthPx,
    beatsIn,
    msToPx,
    pixelsPerMillisecond,
    pxToMs,
    snapToBeat,
    toBarsAndBeats,
    type TimelineScale,
} from "./timeline";

const scale = (overrides: Partial<TimelineScale> = {}): TimelineScale => ({
    bpm: 120,
    timeSignature: "4/4",
    pixelsPerBeat: 48,
    ...overrides,
});

describe("pixels and milliseconds", () => {
    it("a beat is one beat wide", () => {
        expect(msToPx(500, scale())).toBe(48);
    });

    it("round-trips at every tempo and signature the app allows", () => {
        for (const [bpm, timeSignature] of [
            [120, "4/4"],
            [90, "3/4"],
            [140, "7/8"],
            [20, "4/4"],
            [300, "12/8"],
        ] as const) {
            const current = scale({ bpm, timeSignature });

            for (const ms of [0, 1, 999, 60_000, 3_600_000]) {
                expect(pxToMs(msToPx(ms, current), current)).toBeCloseTo(ms, 6);
            }
        }
    });

    it("a faster tempo packs more time into the same pixel", () => {
        expect(pixelsPerMillisecond(scale({ bpm: 240 }))).toBeCloseTo(
            pixelsPerMillisecond(scale({ bpm: 120 })) * 2,
            10,
        );
    });

    it("an eighth-note beat is half as wide as a quarter-note one", () => {
        expect(beatWidthPx(scale({ timeSignature: "4/4" }))).toBe(48);
        expect(beatWidthPx(scale({ timeSignature: "7/8" }))).toBe(24);
    });
});

describe("snapping", () => {
    it("pulls a moment to the nearest beat", () => {
        expect(snapToBeat(240, scale())).toBe(0);
        expect(snapToBeat(260, scale())).toBe(500);
        expect(snapToBeat(1_100, scale())).toBe(1_000);
    });

    it("snaps in 7/8, where a beat is not half a second", () => {
        const seven = scale({ timeSignature: "7/8" });

        expect(snapToBeat(200, seven)).toBe(250);
        expect(snapToBeat(120, seven)).toBe(0);
    });

    it("a finer division snaps to smaller steps", () => {
        expect(snapToBeat(260, scale(), 2)).toBe(250);
        expect(snapToBeat(130, scale(), 4)).toBe(125);
    });

    it("never snaps before the start of the timeline", () => {
        expect(snapToBeat(-400, scale())).toBe(0);
    });

    it("a moment already on a beat stays where it is", () => {
        for (const ms of [0, 500, 1_000, 60_000]) {
            expect(snapToBeat(ms, scale())).toBe(ms);
        }
    });
});

describe("bars and beats", () => {
    it("counts from one, the way musicians do", () => {
        expect(toBarsAndBeats(0, scale())).toEqual({ bar: 1, beat: 1 });
        expect(toBarsAndBeats(500, scale())).toEqual({ bar: 1, beat: 2 });
        expect(toBarsAndBeats(2_000, scale())).toEqual({ bar: 2, beat: 1 });
    });

    it("respects the number of beats in a bar", () => {
        const three = scale({ timeSignature: "3/4" });

        expect(toBarsAndBeats(1_500, three)).toEqual({ bar: 2, beat: 1 });
    });

    it("beats in counts fractional beats", () => {
        expect(beatsIn(750, scale())).toBe(1.5);
    });
});
