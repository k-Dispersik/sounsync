import { useCallback, useRef } from "react";

import { pointToCursor, type DomainCursor, type TimelineSurface } from "../model/cursor";

// Thirty a second is smooth to the eye and an order of magnitude less traffic
// than every mouse event the browser produces.
const THROTTLE_MS = 33;

/**
 * Turns pointer events over the timeline into domain cursors.
 *
 * Listening on the timeline element rather than the document is what makes the
 * conversion possible at all: a position is only meaningful once it is
 * measured against the surface it was over.
 */
export function useCursorEvents(
    surface: TimelineSurface,
    send: { move: (cursor: DomainCursor) => void; click: (cursor: DomainCursor) => void },
) {
    const lastSentRef = useRef(0);
    const surfaceRef = useRef(surface);
    surfaceRef.current = surface;

    const toCursor = useCallback((event: React.MouseEvent<HTMLElement>): DomainCursor => {
        const bounds = event.currentTarget.getBoundingClientRect();

        return pointToCursor(
            { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
            surfaceRef.current,
        );
    }, []);

    const onMouseMove = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            const now = Date.now();
            if (now - lastSentRef.current < THROTTLE_MS) return;

            lastSentRef.current = now;
            send.move(toCursor(event));
        },
        [send, toCursor],
    );

    const onClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => send.click(toCursor(event)),
        [send, toCursor],
    );

    return { onMouseMove, onClick };
}
