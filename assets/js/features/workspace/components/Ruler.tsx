import React, { type CSSProperties } from "react";

export const RULER_HEIGHT = 32; // px — top ruler

interface Props {
    totalBars: number;
    beatsPerBar: number;
    beatWidth: number;
    millisecondsPerBeat: number;
    hoveredBeat: number | null;
    selectedBeat: number | null;
    onBeatHover: (beatIndex: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number) => void;
}

export default function Ruler({
    totalBars,
    beatsPerBar,
    beatWidth,
    millisecondsPerBeat,
    hoveredBeat,
    selectedBeat,
    onBeatHover,
    onBeatLeave,
    onBeatClick,
}: Props) {
    const bars = Array.from({ length: totalBars }, (_, i) => i);
    const totalBeats = totalBars * beatsPerBar;
    const totalDurationMs = totalBeats * millisecondsPerBeat;
    const totalSeconds = Math.ceil(totalDurationMs / 1000);
    const secondMarkers = Array.from({ length: totalSeconds }, (_, index) => ({
        second: index + 1,
        left: ((index + 1) * 1000 / millisecondsPerBeat) * beatWidth,
    }));
    const barEndLines = Array.from({ length: totalBars }, (_, bar) => (bar + 1) * beatsPerBar * beatWidth);
    const rulerStyle = {
        "--ruler-width": `${totalBeats * beatWidth}px`,
        "--hover-indicator-x": `${(hoveredBeat ?? 0) * beatWidth + beatWidth / 2}px`,
    } as CSSProperties;

    const hoveredBar = hoveredBeat !== null ? Math.floor(hoveredBeat / beatsPerBar) + 1 : null;
    const hoveredBeatInBar = hoveredBeat !== null ? (hoveredBeat % beatsPerBar) + 1 : null;
    const hoveredTimeSeconds = hoveredBeat !== null ? (hoveredBeat * millisecondsPerBeat) / 1000 : null;

    return (
        <div
            className="relative h-8 w-[var(--ruler-width)] flex-shrink-0 border-b border-white/10 bg-zinc-900/80"
            style={rulerStyle}
        >
            {Array.from({ length: totalBeats }, (_, beatIndex) => {
                const indicatorClassName = selectedBeat === beatIndex
                    ? "bg-cyan-200/80"
                    : hoveredBeat === beatIndex
                        ? "bg-cyan-100/60"
                        : "bg-transparent";

                return (
                    <button
                        key={beatIndex}
                        type="button"
                        aria-label={`Jump to beat ${beatIndex + 1}`}
                        className="absolute inset-y-0 z-10 w-[var(--beat-width)] cursor-pointer"
                        style={{ "--beat-width": `${beatWidth}px`, left: beatIndex * beatWidth } as CSSProperties}
                        onMouseEnter={() => onBeatHover(beatIndex)}
                        onMouseLeave={onBeatLeave}
                        onClick={() => onBeatClick(beatIndex)}
                    >
                        <span
                            className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors ${indicatorClassName}`}
                        />
                    </button>
                );
            })}

            {secondMarkers.map(({ second, left }) => (
                <span
                    key={`second-${second}`}
                    className="absolute top-1 text-[10px] font-mono text-white/40 select-none"
                    style={{ left: left + 4 }}
                >
                    {second}
                </span>
            ))}

            {bars.map((bar) => {
                const x = bar * beatsPerBar * beatWidth;
                return (
                    <React.Fragment key={bar}>
                        {/* Bar tick */}
                        <div
                            className="absolute bottom-0 w-px bg-white/20"
                            style={{ left: x, height: 10 }}
                        />
                        {/* Beat ticks */}
                        {Array.from({ length: beatsPerBar - 1 }, (_, b) => b + 1).map((b) => (
                            <div
                                key={b}
                                className="absolute bottom-0 w-px bg-white/10"
                                style={{ left: x + b * beatWidth, height: 5 }}
                            />
                        ))}
                    </React.Fragment>
                );
            })}

            {barEndLines.map((x, index) => (
                <div
                    key={`bar-end-${index}`}
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-blue-950/90"
                    style={{ left: x - 1, height: "100%" }}
                />
            ))}

            {hoveredBeat !== null && hoveredBar !== null && hoveredBeatInBar !== null && hoveredTimeSeconds !== null && (
                <div
                    className="pointer-events-none absolute -top-7 z-20 rounded-md border border-cyan-300/30 bg-cyan-400/12 px-2 py-1 text-[10px] font-medium text-cyan-100 shadow-lg shadow-cyan-950/30"
                    style={{ left: "var(--hover-indicator-x)", transform: "translateX(-50%)" }}
                >
                    {`Bar ${hoveredBar} · Beat ${hoveredBeatInBar} · ${hoveredTimeSeconds.toFixed(2)}s`}
                </div>
            )}
        </div>
    );
}
