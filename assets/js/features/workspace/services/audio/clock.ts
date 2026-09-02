/**
 * The one place that converts between timeline time and audio-context time.
 *
 * Pure on purpose: this is the arithmetic that decides whether a kick lands on
 * the beat, and it can be checked exhaustively without an `AudioContext`.
 *
 * `performance.now()` has no business in the audio path. It drifts against the
 * audio clock, and it stops entirely when the tab is hidden — which is exactly
 * when a scheduled sound must still play at the right moment.
 */
export interface TimeMap {
    /** `audioContext.currentTime` at the moment playback started. */
    contextStartedAt: number;
    /** Where on the timeline playback started, in milliseconds. */
    startedFromMs: number;
}

export function contextTimeOf(timelineMs: number, map: TimeMap): number {
    return map.contextStartedAt + (timelineMs - map.startedFromMs) / 1000;
}

export function timelineMsOf(contextTime: number, map: TimeMap): number {
    return map.startedFromMs + (contextTime - map.contextStartedAt) * 1000;
}

/** Milliseconds per beat at a given tempo. */
export function millisecondsPerBeat(bpm: number): number {
    return 60_000 / bpm;
}

/**
 * Beats per bar and the note value that gets the beat, from `"7/8"`.
 *
 * Anything unrecognised falls back to common time rather than throwing: a
 * malformed setting should not silence the project.
 */
export function parseTimeSignature(value: string | undefined): {
    beatsPerBar: number;
    beatUnit: number;
} {
    const [rawBeats, rawUnit] = (value ?? "").split("/");
    const beatsPerBar = Number(rawBeats);
    const beatUnit = Number(rawUnit);

    if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) return { beatsPerBar: 4, beatUnit: 4 };
    if (!Number.isFinite(beatUnit) || beatUnit <= 0) return { beatsPerBar, beatUnit: 4 };

    return { beatsPerBar, beatUnit };
}

/**
 * Milliseconds for one beat of the given signature.
 *
 * A beat in 7/8 is an eighth note, which is half the length of the quarter note
 * the tempo is quoted in — getting this wrong makes every compound signature
 * play at the wrong speed.
 */
export function beatDurationMs(bpm: number, timeSignature: string | undefined): number {
    const { beatUnit } = parseTimeSignature(timeSignature);

    return millisecondsPerBeat(bpm) * (4 / beatUnit);
}

export function msToBeats(ms: number, bpm: number, timeSignature?: string): number {
    return ms / beatDurationMs(bpm, timeSignature);
}

export function beatsToMs(beats: number, bpm: number, timeSignature?: string): number {
    return beats * beatDurationMs(bpm, timeSignature);
}
