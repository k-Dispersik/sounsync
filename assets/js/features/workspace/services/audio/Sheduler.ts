

import { AudioEngine } from "./AudioEngine";
import { SchedulerEvent } from "./types";


// TODO: add lookahead
export class Scheduler {
    private events: SchedulerEvent[] = [];

    constructor(private engine: AudioEngine) { }

    add(event: SchedulerEvent) {
        this.events.push(event);
    }

    start() {
        const loop = () => {
            const now = performance.now();

            const toPlay = this.events.filter(
                e => e.time <= now
            );

            toPlay.forEach(e => {
                this.engine.play(e.sound);
            });

            this.events = this.events.filter(
                e => e.time > now
            );

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }
}