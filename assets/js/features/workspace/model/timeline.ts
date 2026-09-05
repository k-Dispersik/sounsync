import { beatDurationMs, millisecondsPerBeat, parseTimeSignature } from "../services/audio/clock";

/**
 * The arithmetic that turns musical time into pixels and back.
 *
 * Pure and shared, because two places have to agree on it exactly: the
 * timeline draws with it, and a peer's cursor is placed with it. When they
 * disagree, a clip lands a pixel off after every drag — the kind of bug you
 * hear before you see.
 */
export interface TimelineScale {
    bpm: number;
    timeSignature: string;
    /** Width of one quarter note, in pixels. */
    pixelsPerBeat: number;
}

export function pixelsPerMillisecond(scale: TimelineScale): number {
    return scale.pixelsPerBeat / millisecondsPerBeat(scale.bpm);
}

export function msToPx(ms: number, scale: TimelineScale): number {
    return ms * pixelsPerMillisecond(scale);
}

export function pxToMs(px: number, scale: TimelineScale): number {
    return px / pixelsPerMillisecond(scale);
}

/** Width of one beat of the signature, in pixels. */
export function beatWidthPx(scale: TimelineScale): number {
    return msToPx(beatDurationMs(scale.bpm, scale.timeSignature), scale);
}

/** How many beats fit in a stretch of time. */
export function beatsIn(ms: number, scale: TimelineScale): number {
    return ms / beatDurationMs(scale.bpm, scale.timeSignature);
}

/**
 * Rounds a moment to the nearest beat.
 *
 * Snapping is what makes a dragged clip land in time with everything else;
 * `division` allows finer grids — 2 for eighths of the beat, and so on.
 */
export function snapToBeat(ms: number, scale: TimelineScale, division = 1): number {
    const step = beatDurationMs(scale.bpm, scale.timeSignature) / Math.max(1, division);

    return Math.max(0, Math.round(ms / step) * step);
}

/** Bars and beats for a moment, counting from one, the way musicians do. */
export function toBarsAndBeats(ms: number, scale: TimelineScale): { bar: number; beat: number } {
    const { beatsPerBar } = parseTimeSignature(scale.timeSignature);
    const totalBeats = Math.max(0, beatsIn(ms, scale));

    return {
        bar: Math.floor(totalBeats / beatsPerBar) + 1,
        beat: Math.floor(totalBeats % beatsPerBar) + 1,
    };
}

/**
 * The clip a moment falls inside, if there is one.
 *
 * The end is exclusive: two clips laid back to back should not both answer to
 * the boundary between them, and the later one is the one being pointed at.
 */
export function clipAt<T extends { start_time: number; duration: number }>(
    clips: readonly T[],
    ms: number,
): T | null {
    return (
        clips.find((clip) => ms >= clip.start_time && ms < clip.start_time + clip.duration) ?? null
    );
}

/**
 * The clip a selected beat refers to.
 *
 * A selection is a beat, but a clip may start part-way through one, so asking
 * only what covers the beat's first millisecond would miss it — and delete its
 * neighbour instead, which is a bad way to find out.
 */
export function clipInBeat<T extends { start_time: number; duration: number }>(
    clips: readonly T[],
    fromMs: number,
    beatMs: number,
): T | null {
    return (
        clipAt(clips, fromMs) ??
        clips.find((clip) => clip.start_time >= fromMs && clip.start_time < fromMs + beatMs) ??
        null
    );
}
