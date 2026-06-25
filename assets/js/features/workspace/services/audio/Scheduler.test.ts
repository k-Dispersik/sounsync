import { describe, expect, it } from "vitest";

import { Scheduler } from "./Scheduler";
import type { SchedulerEvent } from "./types";

const event = (time: number): SchedulerEvent => ({
    time,
    sound: { kind: "sample", url: `samples/${time}.wav` },
});

describe("Scheduler", () => {
    it("starts empty", () => {
        expect(new Scheduler().getEvents()).toEqual([]);
    });

    it("keeps added events in insertion order", () => {
        const scheduler = new Scheduler();
        const first = event(0);
        const second = event(500);

        scheduler.add(second);
        scheduler.add(first);

        expect(scheduler.getEvents()).toEqual([second, first]);
    });
});
