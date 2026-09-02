import { describe, expect, it } from "vitest";

import type { TimeMap } from "./clock";
import { Scheduler, type ScheduledEvent } from "./Scheduler";

const map: TimeMap = { contextStartedAt: 100, startedFromMs: 0 };

const event = (id: string, timeMs: number): ScheduledEvent => ({
    id,
    timeMs,
    durationMs: 500,
    trackId: 1,
    source: { kind: "sample", bufferKey: "kick" },
    gain: 1,
});

describe("Scheduler", () => {
    it("queues what falls inside the lookahead window", () => {
        const scheduler = new Scheduler({ windowMs: 100 });
        scheduler.setEvents([event("a", 0), event("b", 50), event("c", 5_000)]);

        const due = scheduler.due(100, map);

        expect(due.map((e) => e.id)).toEqual(["a", "b"]);
    });

    it("hands out each event exactly once, however often it is asked", () => {
        const scheduler = new Scheduler({ windowMs: 100 });
        scheduler.setEvents([event("a", 0), event("b", 50)]);

        scheduler.due(100, map);
        const second = scheduler.due(100.025, map);

        expect(second).toEqual([]);
    });

    it("picks events up as the window moves over them", () => {
        const scheduler = new Scheduler({ windowMs: 100 });
        scheduler.setEvents([event("a", 0), event("b", 500), event("c", 1_000)]);

        expect(scheduler.due(100, map).map((e) => e.id)).toEqual(["a"]);
        expect(scheduler.due(100.45, map).map((e) => e.id)).toEqual(["b"]);
        expect(scheduler.due(100.95, map).map((e) => e.id)).toEqual(["c"]);
    });

    it("keeps events in time order whatever order they were given in", () => {
        const scheduler = new Scheduler({ windowMs: 10_000 });
        scheduler.setEvents([event("late", 5_000), event("early", 0), event("middle", 2_000)]);

        expect(scheduler.due(100, map).map((e) => e.id)).toEqual(["early", "middle", "late"]);
    });

    it("skips events before the point playback started from", () => {
        const scheduler = new Scheduler({ windowMs: 10_000 });
        scheduler.setEvents([event("before", 0), event("after", 4_000)]);

        const from = { contextStartedAt: 100, startedFromMs: 3_000 };

        expect(scheduler.due(100, from).map((e) => e.id)).toEqual(["after"]);
    });

    it("reset lets the same events be scheduled again after a seek", () => {
        const scheduler = new Scheduler({ windowMs: 100 });
        scheduler.setEvents([event("a", 0)]);
        scheduler.due(100, map);

        scheduler.reset();

        expect(scheduler.due(100, map).map((e) => e.id)).toEqual(["a"]);
    });

    it("says exactly when an event should start on the audio clock", () => {
        const scheduler = new Scheduler();

        expect(scheduler.contextTimeFor(event("a", 2_500), map)).toBe(102.5);
    });

    it("a wider window queues further ahead", () => {
        const narrow = new Scheduler({ windowMs: 100 });
        const wide = new Scheduler({ windowMs: 1_000 });
        const events = [event("a", 0), event("b", 900)];

        narrow.setEvents(events);
        wide.setEvents(events);

        expect(narrow.due(100, map)).toHaveLength(1);
        expect(wide.due(100, map)).toHaveLength(2);
    });

    it("an empty project schedules nothing and does not fall over", () => {
        expect(new Scheduler().due(100, map)).toEqual([]);
    });
});
