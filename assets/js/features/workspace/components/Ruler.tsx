import React from "react";

export const RULER_HEIGHT = 32; // px — top ruler

export default function Ruler({
    totalBars,
    beatsPerBar,
    beatWidth,
}: {
    totalBars: number;
    beatsPerBar: number;
    beatWidth: number;
}) {
    const bars = Array.from({ length: totalBars }, (_, i) => i);

    return (
        <div
            className="relative flex-shrink-0 border-b border-white/10 bg-zinc-900/80"
            style={{ height: RULER_HEIGHT, width: totalBars * beatsPerBar * beatWidth }}
        >
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
        </div>
    );
}
