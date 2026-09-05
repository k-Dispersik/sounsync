import { useCallback, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";

import type { Track } from "@/shared/types";
import { clipColor } from "../model/clipColor";
import type { TimelineScale } from "../model/timeline";
import TrackClip from "./TrackClip";

interface TrackRowProps {
    track: Track;
    totalBeats: number;
    beatWidth: number;
    beatsPerBar: number;
    pixelsPerMillisecond: number;
    scale: TimelineScale;
    isLast: boolean;
    hoveredBeat: number | null;
    hoveredTrackId: number | null;
    selectedBeat: number | null;
    selectedTrackId: number | null;
    onBeatHover: (beatIndex: number, trackId: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number, trackId: number, rowIndex: number) => void;
}

/**
 * One track's lane.
 *
 * The grid used to be a node per beat, twice over — a button to click and a
 * line to look at. On a five minute project at 120 bpm that is well over ten
 * thousand elements for something the browser can draw with two gradients, and
 * every hover walked all of them.
 *
 * So the lines are painted, and the whole lane is one interactive surface that
 * works out which beat the pointer is over. Arrow keys move along the lane, so
 * a beat is still reachable without a mouse.
 */
export default function TrackRow({
    track,
    totalBeats,
    beatWidth,
    beatsPerBar,
    pixelsPerMillisecond,
    scale,
    isLast,
    hoveredBeat,
    hoveredTrackId,
    selectedBeat,
    selectedTrackId,
    onBeatHover,
    onBeatLeave,
    onBeatClick,
}: TrackRowProps) {
    const beatAt = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const beat = Math.floor((event.clientX - bounds.left) / beatWidth);

            return Math.min(Math.max(beat, 0), totalBeats - 1);
        },
        [beatWidth, totalBeats],
    );

    const activeBeat = selectedTrackId === track.id ? selectedBeat : null;
    const pointerBeat = hoveredTrackId === track.id ? hoveredBeat : null;

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

        if (step === 0) return;

        event.preventDefault();
        const next = Math.min(Math.max((activeBeat ?? 0) + step, 0), totalBeats - 1);
        onBeatClick(next, track.id, track.row_index);
    };

    const rowStyle = {
        "--beat-width": `${beatWidth}px`,
        "--bar-width": `${beatWidth * beatsPerBar}px`,
        "--marker-x": `${(pointerBeat ?? activeBeat ?? 0) * beatWidth}px`,
    } as CSSProperties;

    return (
        <div
            className={`relative h-[var(--track-row-height)] flex-shrink-0 overflow-hidden
                ${isLast ? "" : "border-b border-token"}`}
            style={rowStyle}
        >
            {/* Two painted grids: beats, and the heavier line that starts a bar. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(to right, var(--color-grid-line) 0 1px, transparent 1px var(--beat-width))," +
                        "repeating-linear-gradient(to right, var(--color-grid-bar) 0 1px, transparent 1px var(--bar-width))",
                }}
            />

            {(pointerBeat !== null || activeBeat !== null) && (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 z-10 w-[var(--beat-width)]
                        ${activeBeat !== null ? "bg-selected-overlay" : "bg-hover-overlay"}`}
                    style={{ left: "var(--marker-x)" }}
                />
            )}

            <div
                role="button"
                tabIndex={0}
                aria-label={`Track ${track.row_index + 1} timeline`}
                className="absolute inset-0 z-0 cursor-pointer focus-ring"
                onMouseMove={(event) => onBeatHover(beatAt(event), track.id)}
                onMouseLeave={onBeatLeave}
                onClick={(event) => onBeatClick(beatAt(event), track.id, track.row_index)}
                onKeyDown={handleKeyDown}
            />

            {track.clips.map((clip) => (
                <TrackClip
                    key={clip.id}
                    projectId={track.project_id}
                    trackId={track.id}
                    color={clipColor(clip.type)}
                    clip={clip}
                    pixelsPerMillisecond={pixelsPerMillisecond}
                    scale={scale}
                />
            ))}
        </div>
    );
}
