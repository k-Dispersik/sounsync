import { useEffect, useRef, useSyncExternalStore } from "react";

import type { Player } from "../services/audio/Player";

/**
 * The line showing where playback has got to.
 *
 * It moves sixty times a second, and the timeline it moves across is thousands
 * of nodes, so it must not go through React state: the position is written
 * straight onto a CSS variable from a requestAnimationFrame loop. React is
 * told only when the transport starts or stops.
 *
 * The position itself comes from the player, which derives it from the audio
 * clock — so the line stays with the sound rather than with the frame rate.
 */
export default function Playhead({
    player,
    pixelsPerMillisecond,
    surfaceRef,
}: {
    player: Player;
    pixelsPerMillisecond: number;
    surfaceRef: React.RefObject<HTMLElement | null>;
}) {
    const state = useSyncExternalStore(
        (listener) => player.subscribe(listener),
        () => player.getState(),
    );

    const frameRef = useRef(0);

    useEffect(() => {
        const surface = surfaceRef.current;

        if (!surface) return;

        const write = () => {
            surface.style.setProperty(
                "--playhead-x",
                `${player.positionMs() * pixelsPerMillisecond}px`,
            );
        };

        write();

        if (state !== "playing") return;

        const step = () => {
            write();
            frameRef.current = requestAnimationFrame(step);
        };

        frameRef.current = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frameRef.current);
    }, [player, pixelsPerMillisecond, state, surfaceRef]);

    if (state === "stopped") return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-30 w-0.5 bg-error"
            style={{ left: "var(--playhead-x, 0px)" }}
        />
    );
}
