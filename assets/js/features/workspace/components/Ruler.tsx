import { Fragment, type CSSProperties } from "react";

export const RULER_HEIGHT = 32; // px — top ruler

interface TimelineMarker {
    second: number;
    left: number;
}

interface RulerTick {
    beatIndex: number;
    left: number;
    secondMarker: TimelineMarker | null;
    isBarStart: boolean;
}

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
    const rulerStyle = {
        "--ruler-width": `${contentWidth}px`,
        "--hover-indicator-x": `${(hoveredBeat ?? 0) * beatWidth + beatWidth / 2}px`,
    } as CSSProperties;
    const secondMarkers = Array.from(
        { length: Math.floor(contentWidth / (1000 * pixelsPerMillisecond)) },
        (_, index) =>
            ({
                second: index + 1,
                left: (index + 1) * 1000 * pixelsPerMillisecond,
            }) satisfies TimelineMarker,
    );
    const secondMarkerByBeat = new Map(
        secondMarkers.map((marker) => [Math.floor(marker.left / beatWidth), marker] as const),
    );
    const rulerTicks = Array.from(
        { length: totalBeats },
        (_, beatIndex) =>
            ({
                beatIndex,
                left: beatIndex * beatWidth,
                secondMarker: secondMarkerByBeat.get(beatIndex) ?? null,
                isBarStart: beatIndex % beatsPerBar === 0,
            }) satisfies RulerTick,
    );

    return (
        <div
            className="relative h-8 w-[var(--ruler-width)] flex-shrink-0 border-b border-base-content/10 bg-base-300/80"
            style={rulerStyle}
        >
            {rulerTicks.map(({ beatIndex, left, secondMarker, isBarStart }) => {
                const indicatorClassName =
                    selectedBeat === beatIndex
                        ? "bg-cyan-200/80"
                        : hoveredBeat === beatIndex
                          ? "bg-cyan-100/60"
                          : "bg-transparent";

                return (
                    <Fragment key={beatIndex}>
                        <button
                            type="button"
                            aria-label={`Jump to beat ${beatIndex + 1}`}
                            className="absolute inset-y-0 z-10 w-[var(--beat-width)] cursor-pointer"
                            style={{ "--beat-width": `${beatWidth}px`, left } as CSSProperties}
                            onMouseEnter={() => onBeatHover(beatIndex)}
                            onMouseLeave={onBeatLeave}
                            onClick={() => onBeatClick(beatIndex)}
                        >
                            <span
                                className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors ${indicatorClassName}`}
                            />
                        </button>
                        {secondMarker && (
                            <span
                                className="absolute top-1 text-[10px] font-mono text-base-content/40 select-none"
                                style={{ left: secondMarker.left + 4 }}
                            >
                                {secondMarker.second}
                            </span>
                        )}

                        {isBarStart && (
                            <div
                                className="absolute bottom-0 w-px bg-base-content/20"
                                style={{ left, height: 10 }}
                            />
                        )}
                    </Fragment>
                );
            })}
        </div>
    );
}
