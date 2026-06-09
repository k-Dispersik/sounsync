

import { AudioEngine } from "./AudioEngine";
import { SchedulerEvent } from "./types";


// TODO: add lookaheadexport 
class Scheduler {
    private events: SchedulerEvent[] = [];

    add(event: SchedulerEvent) {
        this.events.push(event);
    }

    getEvents() {
        return this.events;
    }
}


export default Scheduler;