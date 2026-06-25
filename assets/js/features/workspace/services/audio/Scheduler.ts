import { SchedulerEvent } from "./types";

// Events are kept in insertion order. The lookahead window that decides which
// of them to hand to the audio clock is not implemented yet.
export class Scheduler {
    private events: SchedulerEvent[] = [];

    add(event: SchedulerEvent) {
        this.events.push(event);
    }

    getEvents() {
        return this.events;
    }
}
