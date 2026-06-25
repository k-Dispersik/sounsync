import { AudioEngine } from "./AudioEngine";
import { Scheduler } from "./Scheduler";
import { SchedulerEvent } from "./types";

export class Player {
    private raf = 0;
    private startAt = 0;
    private offset = 0;
    private played = new Set<SchedulerEvent>();

    constructor(
        private scheduler: Scheduler,
        private engine: AudioEngine,
    ) {}

    start(offset = 0) {
        this.offset = offset;
        this.startAt = performance.now();
        this.tick();
    }

    pause() {
        cancelAnimationFrame(this.raf);
        this.offset = this.getCurrentTime();
    }

    stop() {
        cancelAnimationFrame(this.raf);
        this.offset = 0;
        this.played.clear();
    }

    seek(time: number) {
        this.offset = time;
        this.played.clear();
    }

    private getCurrentTime() {
        return this.offset + (performance.now() - this.startAt);
    }

    private tick = () => {
        const now = this.getCurrentTime();

        for (const e of this.scheduler.getEvents()) {
            if (!this.played.has(e) && e.time <= now) {
                this.engine.play(e.sound);
                this.played.add(e);
            }
        }

        this.raf = requestAnimationFrame(this.tick);
    };
}
