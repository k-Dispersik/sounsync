import type { TimeMap } from "./clock";
import { timelineMsOf } from "./clock";
import { Scheduler, type ScheduledEvent } from "./Scheduler";

/**
 * Where the player sends sound, and where it reads the clock.
 *
 * An interface rather than an `AudioContext` so the transport can be tested
 * with a clock that does not tick on its own: "play, pause, play again"
 * resuming from the right place is logic, not audio.
 */
export interface AudioSink {
    /** Current time on the audio clock, in seconds. */
    now(): number;
    /** Queue an event to start at the given audio-clock time. */
    schedule(event: ScheduledEvent, atContextTime: number): void;
    /** Stop everything already queued. */
    cancel(): void;
}

export type PlayerState = "stopped" | "playing" | "paused";

export interface PlayerOptions {
    /** How often to look ahead, in milliseconds. */
    tickMs?: number;
    setInterval?: (handler: () => void, ms: number) => number;
    clearInterval?: (handle: number) => void;
}

// Twenty-five milliseconds is often enough that a busy main thread still hits
// the hundred millisecond lookahead window with room to spare.
const DEFAULT_TICK_MS = 25;

/**
 * The transport: play, pause, resume, seek.
 *
 * Position is derived from the audio clock rather than counted up by the timer,
 * so a late tick does not make the playhead drift. Pausing remembers where it
 * got to and resuming carries on from there — the previous implementation
 * always restarted from zero (B-7).
 */
export class Player {
    private state: PlayerState = "stopped";
    private positionMsAtPause = 0;
    private map: TimeMap = { contextStartedAt: 0, startedFromMs: 0 };
    private handle: number | null = null;
    private readonly tickMs: number;
    private readonly startTimer: (handler: () => void, ms: number) => number;
    private readonly stopTimer: (handle: number) => void;
    private listeners = new Set<() => void>();

    constructor(
        private readonly scheduler: Scheduler,
        private readonly sink: AudioSink,
        options: PlayerOptions = {},
    ) {
        this.tickMs = options.tickMs ?? DEFAULT_TICK_MS;
        this.startTimer = options.setInterval ?? ((handler, ms) => setInterval(handler, ms));
        this.stopTimer = options.clearInterval ?? ((handle) => clearInterval(handle));
    }

    getState(): PlayerState {
        return this.state;
    }

    /** Where the playhead is now, in milliseconds. */
    positionMs(): number {
        if (this.state !== "playing") return this.positionMsAtPause;

        return timelineMsOf(this.sink.now(), this.map);
    }

    play(): void {
        if (this.state === "playing") return;

        this.map = {
            contextStartedAt: this.sink.now(),
            startedFromMs: this.positionMsAtPause,
        };

        this.scheduler.reset();
        this.state = "playing";
        this.tick();

        this.handle = this.startTimer(() => this.tick(), this.tickMs);
        this.notify();
    }

    pause(): void {
        if (this.state !== "playing") return;

        this.positionMsAtPause = this.positionMs();
        this.halt("paused");
    }

    stop(): void {
        this.positionMsAtPause = 0;
        this.halt("stopped");
    }

    /**
     * Moves the playhead. While playing, everything already queued is dropped
     * and scheduling starts again from the new position — otherwise sounds from
     * the old position would still arrive.
     */
    seek(timelineMs: number): void {
        const wasPlaying = this.state === "playing";

        this.positionMsAtPause = Math.max(0, timelineMs);

        if (wasPlaying) {
            this.halt("paused");
            this.play();
        } else {
            this.notify();
        }
    }

    /** For `useSyncExternalStore`: the playhead is read, not rendered from state. */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    destroy(): void {
        this.halt("stopped");
        this.listeners.clear();
    }

    private tick(): void {
        if (this.state !== "playing") return;

        const now = this.sink.now();

        for (const event of this.scheduler.due(now, this.map)) {
            this.sink.schedule(event, this.scheduler.contextTimeFor(event, this.map));
        }
    }

    private halt(state: PlayerState): void {
        if (this.handle !== null) {
            this.stopTimer(this.handle);
            this.handle = null;
        }

        this.sink.cancel();
        this.scheduler.reset();
        this.state = state;
        this.notify();
    }

    private notify(): void {
        for (const listener of this.listeners) listener();
    }
}
