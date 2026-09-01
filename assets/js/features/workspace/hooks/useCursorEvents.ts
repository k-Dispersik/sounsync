import { useCallback, useMemo, useRef } from "react";

import { throttle } from "@/shared/lib/rate";
import { pointToCursor, type DomainCursor, type TimelineSurface } from "../model/cursor";

// Thirty a second is smooth to the eye and an order of magnitude less traffic
// than every mouse event the browser produces.
const CURSOR_HZ = 30;

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
    const surfaceRef = useRef(surface);
    surfaceRef.current = surface;

    const toCursor = useCallback((event: React.MouseEvent<HTMLElement>): DomainCursor => {
        const bounds = event.currentTarget.getBoundingClientRect();

        return pointToCursor(
            { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
            surfaceRef.current,
        );
    }, []);

    const sendMove = useMemo(
        () => throttle((cursor: DomainCursor) => send.move(cursor), 1000 / CURSOR_HZ),
        [send],
    );

    const onMouseMove = useCallback(
        (event: React.MouseEvent<HTMLElement>) => sendMove(toCursor(event)),
        [sendMove, toCursor],
    );

    const onClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => send.click(toCursor(event)),
        [send, toCursor],
    );

    return { onMouseMove, onClick };
}
