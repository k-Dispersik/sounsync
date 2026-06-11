import { useEffect, useRef } from "react";

const THROTTLE_MS = 50;

/**
 * Attaches document-level mousemove / click listeners and calls the provided
 * callbacks. Throttles move events to avoid flooding the transport layer.
 */
export function useCursorEvents(
    sendMove: (x: number, y: number) => void,
    sendClick: (x: number, y: number) => void,
): void {
    const lastSentRef = useRef(0);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastSentRef.current < THROTTLE_MS) return;
            lastSentRef.current = now;
            sendMove(e.clientX, e.clientY);
        };

        const handleClick = (e: MouseEvent) => {
            sendClick(e.clientX, e.clientY);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("click", handleClick);
        };
    }, [sendMove, sendClick]);
}
