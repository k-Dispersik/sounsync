import { contextTimeOf, type TimeMap } from "./clock";

/**
 * Something to play, positioned on the timeline rather than in the audio clock.
 *
 * `id` is what makes an event schedulable exactly once: it identifies the clip
 * it came from, so a window that overlaps the previous one does not queue the
 * same kick twice.
 */
export interface ScheduledEvent {
    id: string;
    timeMs: number;
    durationMs: number;
    trackId: number;
    source: { kind: "sample"; bufferKey: string };
    gain: number;
}

export interface LookaheadOptions {
    /** How far ahead of the clock to queue sounds, in milliseconds. */
    windowMs?: number;
}

const DEFAULT_WINDOW_MS = 100;

/**
 * Decides what to hand to the audio clock, and when.
 *
 * The old player started a sound at the moment a requestAnimationFrame callback
 * happened to run, which is 0–16 ms late at sixty frames a second, worse under
 * load, and never at all when the tab is hidden. For rhythmic music that is
 * audible immediately.
 *
 * Instead, a cheap timer looks a little way ahead and queues everything falling
 * into that window with an exact context time. The timer only has to be roughly
 * on schedule; the accuracy comes from the audio clock, which is the one thing
 * in the browser that keeps time properly.
 */
export class Scheduler {
    private events: ScheduledEvent[] = [];
    private queued = new Set<string>();
    private readonly windowMs: number;

    constructor(options: LookaheadOptions = {}) {
        this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    }

    /** Replaces everything the scheduler knows about. */
    setEvents(events: ScheduledEvent[]): void {
        this.events = [...events].sort((a, b) => a.timeMs - b.timeMs);
    }

    getEvents(): ScheduledEvent[] {
        return this.events;
    }

    /**
     * Forgets what has been queued, so the same events can be scheduled again.
     * Called when playback restarts or jumps somewhere else.
     */
    reset(): void {
        this.queued.clear();
    }

    /**
     * Everything that should be queued now: started at or after `fromMs`, and
     * due before the lookahead window closes.
     *
     * Events already handed out are not returned again, which is what lets this
     * be called on a fast timer with overlapping windows.
     */
    due(contextTime: number, map: TimeMap, fromMs = map.startedFromMs): ScheduledEvent[] {
        const horizonMs = this.timelineHorizon(contextTime, map);

        const ready = this.events.filter(
            (event) =>
                !this.queued.has(event.id) && event.timeMs >= fromMs && event.timeMs <= horizonMs,
        );

        for (const event of ready) this.queued.add(event.id);

        return ready;
    }

    /** When a scheduled event should start, in audio-context time. */
    contextTimeFor(event: ScheduledEvent, map: TimeMap): number {
        return contextTimeOf(event.timeMs, map);
    }

    private timelineHorizon(contextTime: number, map: TimeMap): number {
        const elapsedMs = (contextTime - map.contextStartedAt) * 1000;

        return map.startedFromMs + elapsedMs + this.windowMs;
    }
}
