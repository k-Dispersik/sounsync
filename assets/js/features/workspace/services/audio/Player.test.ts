import { beforeEach, describe, expect, it, vi } from "vitest";

import { Player, type AudioSink } from "./Player";
import { Scheduler, type ScheduledEvent } from "./Scheduler";

/** A clock that only moves when a test says so. */
class FakeSink implements AudioSink {
    time = 0;
    scheduled: { id: string; at: number }[] = [];
    cancelled = 0;

    now() {
        return this.time;
    }

    schedule(event: ScheduledEvent, atContextTime: number) {
        this.scheduled.push({ id: event.id, at: atContextTime });
    }

    cancel() {
        this.cancelled += 1;
    }
}

const event = (id: string, timeMs: number): ScheduledEvent => ({
    id,
    timeMs,
    durationMs: 500,
    trackId: 1,
    source: { kind: "sample", bufferKey: "kick" },
    gain: 1,
});

function setup(events: ScheduledEvent[] = []) {
    const sink = new FakeSink();
    const scheduler = new Scheduler({ windowMs: 100 });
    scheduler.setEvents(events);

    const ticks: (() => void)[] = [];
    const player = new Player(scheduler, sink, {
        setInterval: (handler) => {
            ticks.push(handler);
            return ticks.length;
        },
        clearInterval: () => undefined,
    });

    return { player, sink, tick: () => ticks.forEach((fn) => fn()) };
}

describe("Player", () => {
    let context: ReturnType<typeof setup>;

    beforeEach(() => {
        context = setup([event("a", 0), event("b", 1_000), event("c", 5_000)]);
    });

    it("starts stopped at the beginning", () => {
        expect(context.player.getState()).toBe("stopped");
        expect(context.player.positionMs()).toBe(0);
    });

    it("queues what is due as soon as it starts", () => {
        context.player.play();

        expect(context.sink.scheduled.map((s) => s.id)).toEqual(["a"]);
    });

    it("schedules on the audio clock, not on when the tick happened", () => {
        context.sink.time = 42;
        context.player.play();

        // The event is at 0 ms of a timeline started at 0, so it belongs at the
        // exact context time playback began — not at the time of the tick.
        expect(context.sink.scheduled[0]?.at).toBe(42);
    });

    it("picks up later events as the clock advances", () => {
        context.player.play();
        context.sink.time = 0.95;
        context.tick();

        expect(context.sink.scheduled.map((s) => s.id)).toEqual(["a", "b"]);
    });

    it("the position follows the audio clock", () => {
        context.player.play();
        context.sink.time = 2.5;

        expect(context.player.positionMs()).toBe(2_500);
    });

    it("B-7: resuming carries on from where it paused, not from zero", () => {
        context.player.play();
        context.sink.time = 3;
        context.player.pause();

        expect(context.player.positionMs()).toBe(3_000);

        context.sink.time = 10;
        context.player.play();

        expect(context.player.positionMs()).toBe(3_000);
    });

    it("pausing stops what was already queued", () => {
        context.player.play();
        context.player.pause();

        expect(context.sink.cancelled).toBe(1);
        expect(context.player.getState()).toBe("paused");
    });

    it("resuming does not replay what already sounded before the pause", () => {
        context.player.play();
        context.sink.time = 3;
        context.player.pause();

        context.player.play();
        context.sink.time = 4.95;
        context.tick();

        // "a" was queued by the first play; resuming at 3 s reaches "c" as its
        // moment comes, and never goes back for "b", which is behind us.
        expect(context.sink.scheduled.map((s) => s.id)).toEqual(["a", "c"]);
    });

    it("stop returns to the beginning", () => {
        context.player.play();
        context.sink.time = 3;
        context.player.stop();

        expect(context.player.getState()).toBe("stopped");
        expect(context.player.positionMs()).toBe(0);
    });

    it("seeking while stopped just moves the playhead", () => {
        context.player.seek(4_000);

        expect(context.player.positionMs()).toBe(4_000);
        expect(context.sink.scheduled).toEqual([]);
    });

    it("seeking while playing drops what was queued and starts from there", () => {
        context.player.play();
        context.sink.time = 1;

        context.player.seek(4_950);

        expect(context.sink.cancelled).toBeGreaterThan(0);
        expect(context.player.getState()).toBe("playing");
        // "c" at 5 s is inside the window from 4.95 s; "b" at 1 s is behind.
        expect(context.sink.scheduled.map((s) => s.id)).toEqual(["a", "c"]);
    });

    it("never seeks before the start of the timeline", () => {
        context.player.seek(-5_000);

        expect(context.player.positionMs()).toBe(0);
    });

    it("playing twice does not start two transports", () => {
        context.player.play();
        const scheduledAfterFirst = context.sink.scheduled.length;

        context.player.play();

        expect(context.sink.scheduled).toHaveLength(scheduledAfterFirst);
    });

    it("tells subscribers when the transport changes", () => {
        const listener = vi.fn();
        context.player.subscribe(listener);

        context.player.play();
        context.player.pause();

        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("a subscriber can stop listening", () => {
        const listener = vi.fn();
        const unsubscribe = context.player.subscribe(listener);

        unsubscribe();
        context.player.play();

        expect(listener).not.toHaveBeenCalled();
    });
});
