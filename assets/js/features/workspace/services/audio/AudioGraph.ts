import { createLogger } from "@/shared/lib/logger";
import type { AudioSink } from "./Player";
import type { SampleBank } from "./SampleBank";
import type { ScheduledEvent } from "./Scheduler";

const log = createLogger("AudioGraph");

// Long enough to stop a click, short enough to be inaudible as a fade.
const EDGE_FADE_S = 0.005;

/**
 * The Web Audio side of playback.
 *
 * ```
 * BufferSource → clip gain (5 ms fades) → track gain → master gain → output
 * ```
 *
 * The short fade on every clip is not decoration: cutting a buffer off mid-wave
 * produces a click, and that is the usual reason a home-made web player is
 * described as "crackly".
 *
 * The `AudioContext` is created on first use rather than at import time. A
 * context created without a user gesture starts suspended, and the first Play
 * on the page is then silent — which looks exactly like a broken player (B-9).
 */
export class AudioGraph implements AudioSink {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private trackGains = new Map<number, GainNode>();
    private live = new Set<AudioBufferSourceNode>();

    constructor(private readonly samples: SampleBank) {}

    /**
     * Creates the context if needed and makes sure it is running.
     *
     * Must be called from a user gesture the first time, which is why it is
     * public: the transport calls it when Play is pressed.
     */
    async ensureRunning(): Promise<AudioContext> {
        this.context ??= new AudioContext({ latencyHint: "interactive" });

        if (this.context.state === "suspended") await this.context.resume();

        return this.context;
    }

    now(): number {
        return this.context?.currentTime ?? 0;
    }

    schedule(event: ScheduledEvent, atContextTime: number): void {
        const context = this.context;

        if (!context) return;

        const buffer = this.samples.get(event.source.bufferKey);

        if (!buffer) {
            // Playing silence is better than throwing mid-bar; the sample will
            // be there next time round once loading has caught up.
            log.warn(`no buffer for ${event.source.bufferKey}, skipping`);
            return;
        }

        const startAt = Math.max(atContextTime, context.currentTime);
        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        const level = event.gain;
        const endAt = startAt + Math.min(buffer.duration, event.durationMs / 1000);

        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(level, startAt + EDGE_FADE_S);
        gain.gain.setValueAtTime(level, Math.max(startAt, endAt - EDGE_FADE_S));
        gain.gain.linearRampToValueAtTime(0, endAt);

        source.connect(gain).connect(this.trackGain(event.trackId));
        source.start(startAt);
        source.stop(endAt);

        this.live.add(source);
        source.onended = () => this.live.delete(source);
    }

    cancel(): void {
        for (const source of this.live) {
            try {
                source.stop();
            } catch {
                // Already finished; nothing to stop.
            }
        }

        this.live.clear();
    }

    /**
     * Sets a track's level.
     *
     * Ramped over a few milliseconds rather than assigned: a step change in
     * gain is a discontinuity in the waveform, which is heard as a click.
     */
    setTrackGain(trackId: number, value: number): void {
        if (!this.context) return;

        const gain = this.trackGain(trackId).gain;

        gain.cancelScheduledValues(this.context.currentTime);
        gain.setTargetAtTime(value, this.context.currentTime, EDGE_FADE_S);
    }

    setMasterGain(value: number): void {
        if (!this.context) return;

        const gain = this.masterGain().gain;

        gain.cancelScheduledValues(this.context.currentTime);
        gain.setTargetAtTime(value, this.context.currentTime, EDGE_FADE_S);
    }

    /** Gain node for a track, created on first use. */
    trackGain(trackId: number): GainNode {
        const context = this.context;

        if (!context) throw new Error("audio context has not been started");

        const existing = this.trackGains.get(trackId);

        if (existing) return existing;

        const gain = context.createGain();
        gain.connect(this.masterGain());
        this.trackGains.set(trackId, gain);

        return gain;
    }

    private masterGain(): GainNode {
        const context = this.context;

        if (!context) throw new Error("audio context has not been started");

        if (!this.master) {
            this.master = context.createGain();
            this.master.connect(context.destination);
        }

        return this.master;
    }

    async close(): Promise<void> {
        this.cancel();
        this.trackGains.clear();
        this.master = null;

        await this.context?.close();
        this.context = null;
    }
}
