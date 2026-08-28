/**
 * Where another participant's pointer is, in the project's own terms.
 *
 * Screen coordinates used to travel over the wire, which meant a cursor landed
 * somewhere else on every window that was not the same size, scrolled to the
 * same place and zoomed the same way. Time and track are the same for
 * everybody, so that is what is sent; each client turns them back into pixels
 * with the numbers it is actually drawing with.
 */
export interface DomainCursor {
    time_ms: number;
    track_id: number | null;
    clicking?: boolean;
}

/** Everything needed to turn domain coordinates into a position on this screen. */
export interface TimelineSurface {
    pixelsPerMillisecond: number;
    /** Top offset of each track lane, in pixels within the timeline content. */
    trackTops: Record<number, number>;
    laneHeight: number;
}

export function cursorToPoint(
    cursor: DomainCursor,
    surface: TimelineSurface,
): { x: number; y: number } | null {
    const top = cursor.track_id == null ? null : surface.trackTops[cursor.track_id];

    // A cursor over a track this client does not have is not drawn: guessing a
    // row would put it on somebody else's audio.
    if (top === undefined) return null;

    return {
        x: cursor.time_ms * surface.pixelsPerMillisecond,
        y: (top ?? 0) + surface.laneHeight / 2,
    };
}

export function pointToCursor(
    point: { x: number; y: number },
    surface: TimelineSurface,
): DomainCursor {
    const trackId = trackAt(point.y, surface);

    return {
        time_ms: Math.max(0, Math.round(point.x / surface.pixelsPerMillisecond)),
        track_id: trackId,
    };
}

function trackAt(y: number, surface: TimelineSurface): number | null {
    const entries = Object.entries(surface.trackTops);

    const hit = entries.find(([, top]) => y >= top && y < top + surface.laneHeight);

    return hit ? Number(hit[0]) : null;
}
