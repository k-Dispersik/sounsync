import React, { type CSSProperties } from "react";

export const RULER_HEIGHT = 32; // px — top ruler

export default function Ruler({
    totalBars,
    beatsPerBar,
    beatWidth,
    hoveredSecond,
    selectedSecond,
    onSecondHover,
    onSecondLeave,
    onSecondClick,
}: {
    totalBars: number;
    beatsPerBar: number;
    beatWidth: number;
    hoveredSecond: number | null;
    selectedSecond: number | null;
    onSecondHover: (second: number) => void;
    onSecondLeave: () => void;
    onSecondClick: (second: number) => void;
}) {
    const bars = Array.from({ length: totalBars }, (_, i) => i);
    const totalSeconds = totalBars * beatsPerBar;
    const rulerStyle = {
        "--ruler-width": `${totalSeconds * beatWidth}px`,
        "--hover-indicator-x": `${(hoveredSecond ?? 0) * beatWidth + beatWidth / 2}px`,
    } as CSSProperties;

    return (
        <div
            className="relative h-8 w-[var(--ruler-width)] flex-shrink-0 border-b border-white/10 bg-zinc-900/80"
            style={rulerStyle}
        >
            {Array.from({ length: totalSeconds }, (_, second) => {
                const indicatorClassName = selectedSecond === second
                    ? "bg-cyan-200/80"
                    : hoveredSecond === second
                        ? "bg-cyan-100/60"
                        : "bg-transparent";

                return (
                    <button
                        key={second}
                        type="button"
                        aria-label={`Jump to second ${second + 1}`}
                        className="absolute inset-y-0 z-10 w-[var(--beat-width)] cursor-pointer"
                        style={{ "--beat-width": `${beatWidth}px`, left: second * beatWidth } as CSSProperties}
                        onMouseEnter={() => onSecondHover(second)}
                        onMouseLeave={onSecondLeave}
                        onClick={() => onSecondClick(second)}
                    >
                        <span
                            className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors ${indicatorClassName}`}
                        />
                    </button>
                );
            })}

            {bars.map((bar) => {
                const x = bar * beatsPerBar * beatWidth;
                return (
                    <React.Fragment key={bar}>
                        {/* Bar number label */}
                        <span
                            className="absolute top-1 text-[10px] font-mono text-white/40 select-none"
                            style={{ left: x + 4 }}
                        >
                            {bar + 1}
                        </span>
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

            {hoveredSecond !== null && (
                <div
                    className="pointer-events-none absolute -top-7 z-20 rounded-md border border-cyan-300/30 bg-cyan-400/12 px-2 py-1 text-[10px] font-medium text-cyan-100 shadow-lg shadow-cyan-950/30"
                    style={{ left: "var(--hover-indicator-x)", transform: "translateX(-50%)" }}
                >
                    {`${hoveredSecond + 1}s`}
                </div>
            )}
        </div>
    );
}
