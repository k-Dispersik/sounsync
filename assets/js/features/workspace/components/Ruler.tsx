import { useCallback, type CSSProperties, type MouseEvent } from "react";

export const RULER_HEIGHT = 32; // px — top ruler

interface Props {
    totalBeats: number;
    beatsPerBar: number;
    beatWidth: number;
    contentWidth: number;
    pixelsPerMillisecond: number;
    hoveredBeat: number | null;
    selectedBeat: number | null;
    onBeatHover: (beatIndex: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number) => void;
}

/**
 * The bar above the timeline: ticks, second markers, and the place you click
 * to move the playhead.
 *
 * Like the lanes, the ticks are painted rather than built. Only the second
 * labels are real elements, and there is one of those per second rather than
 * one per beat.
 */
export default function Ruler({
    totalBeats,
    beatsPerBar,
    beatWidth,
    contentWidth,
    pixelsPerMillisecond,
    hoveredBeat,
    selectedBeat,
    onBeatHover,
    onBeatLeave,
    onBeatClick,
}: Props) {
    const beatAt = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const beat = Math.floor((event.clientX - bounds.left) / beatWidth);

            return Math.min(Math.max(beat, 0), totalBeats - 1);
        },
        [beatWidth, totalBeats],
    );

    const secondsInView = Math.floor(contentWidth / (1000 * pixelsPerMillisecond));
    const secondMarkers = Array.from({ length: secondsInView }, (_unused, index) => ({
        second: index + 1,
        left: (index + 1) * 1000 * pixelsPerMillisecond,
    }));

    const style = {
        "--ruler-width": `${contentWidth}px`,
        "--beat-width": `${beatWidth}px`,
        "--bar-width": `${beatWidth * beatsPerBar}px`,
        "--marker-x": `${(hoveredBeat ?? selectedBeat ?? 0) * beatWidth}px`,
    } as CSSProperties;

    return (
        <div
            className="relative h-[var(--ruler-height)] w-[var(--ruler-width)] flex-shrink-0
                border-b border-token bg-surface-raised"
            style={style}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2.5"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(to right, var(--color-grid-bar) 0 1px, transparent 1px var(--bar-width))",
                }}
            />

            {(hoveredBeat !== null || selectedBeat !== null) && (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 w-[var(--beat-width)]
                        ${selectedBeat !== null ? "bg-selected-overlay" : "bg-hover-overlay"}`}
                    style={{ left: "var(--marker-x)" }}
                />
            )}

            {secondMarkers.map(({ second, left }) => (
                <span
                    key={second}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1 select-none font-mono text-[10px] text-subtle"
                    style={{ left: left + 4 }}
                >
                    {second}
                </span>
            ))}

            {/* The surface sits above the decoration and holds none of it: a
                control whose visible text is a row of numbers has no honest
                accessible name. */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Timeline ruler: click to move the playhead"
                className="absolute inset-0 cursor-pointer focus-ring"
                onMouseMove={(event) => onBeatHover(beatAt(event))}
                onMouseLeave={onBeatLeave}
                onClick={(event) => onBeatClick(beatAt(event))}
            />
        </div>
    );
}
