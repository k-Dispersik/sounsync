import { SchedulerEvent } from "./types";


// TODO: add lookaheadexport 
export class Scheduler {
    private events: SchedulerEvent[] = [];

    add(event: SchedulerEvent) {
        this.events.push(event);
    }

    getEvents() {
        return this.events;
    }
}