import { describe, expect, it } from "vitest";

import { cursorToPoint, pointToCursor, type TimelineSurface } from "./cursor";

const surface: TimelineSurface = {
    pixelsPerMillisecond: 0.05,
    trackTops: { 10: 0, 11: 64, 12: 128 },
    laneHeight: 64,
};

describe("domain cursors", () => {
    it("B-10: the same time lands on the same beat whatever the zoom", () => {
        const zoomedIn: TimelineSurface = { ...surface, pixelsPerMillisecond: 0.1 };

        const cursor = { time_ms: 4_000, track_id: 11 };

        expect(cursorToPoint(cursor, surface)?.x).toBe(200);
        expect(cursorToPoint(cursor, zoomedIn)?.x).toBe(400);
    });

    it("puts the cursor in the middle of its lane", () => {
        expect(cursorToPoint({ time_ms: 0, track_id: 11 }, surface)).toEqual({ x: 0, y: 96 });
    });

    it("does not draw a cursor over a track this client does not have", () => {
        expect(cursorToPoint({ time_ms: 0, track_id: 999 }, surface)).toBeNull();
    });

    it("a cursor between tracks still has a time", () => {
        expect(cursorToPoint({ time_ms: 2_000, track_id: null }, surface)).toEqual({
            x: 100,
            y: 32,
        });
    });

    it("reads a point back into time and track", () => {
        expect(pointToCursor({ x: 200, y: 70 }, surface)).toEqual({
            time_ms: 4_000,
            track_id: 11,
        });
    });

    it("a point above every lane belongs to no track", () => {
        expect(pointToCursor({ x: 0, y: 400 }, surface).track_id).toBeNull();
    });

    it("never reports a negative time", () => {
        expect(pointToCursor({ x: -50, y: 0 }, surface).time_ms).toBe(0);
    });

    it("round-trips a position through the wire format", () => {
        const point = { x: 240, y: 140 };

        const roundTripped = cursorToPoint(pointToCursor(point, surface), surface);

        expect(roundTripped?.x).toBe(point.x);
        expect(roundTripped?.y).toBe(160);
    });
});
