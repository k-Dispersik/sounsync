import React, { useRef } from "react";
import TrackClip from "./TrackClip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Clip {
    id: string;
    start_time: number; // seconds
    duration: number; // seconds
    settings: JSON;
    file_path: string;
}

export interface Track {
    id: string;
    name: string;
    clips: Clip[];
}

interface Props {
    tracks: Track[];
    /** Beats per bar — default 4 */
    beatsPerBar?: number;
    /** Total number of bars to render — default 32 */
    totalBars?: number;
    /** Pixel width of one beat — default 48 */
    beatWidth?: number;
    /** Pixel height of each track row — default 80 */
    trackHeight?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LABEL_WIDTH = 168; // px — left sidebar
const RULER_HEIGHT = 32; // px — top ruler

// ─── Sub-components ───────────────────────────────────────────────────────────

function Ruler({
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

function TrackRow({
    track,
    totalBeats,
    beatWidth,
    trackHeight,
    beatsPerBar,
    isLast,
}: {
    track: Track;
    totalBeats: number;
    beatWidth: number;
    trackHeight: number;
    beatsPerBar: number;
    isLast: boolean;
}) {
    return (
        <div
            className={`relative flex-shrink-0 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
            style={{ height: trackHeight }}
        >
            {/* Beat / bar grid lines */}
            {Array.from({ length: totalBeats }, (_, i) => i).map((beat) => (
                <div
                    key={beat}
                    className={`absolute top-0 bottom-0 w-px ${beat % beatsPerBar === 0 ? "bg-white/[0.06]" : "bg-white/[0.03]"
                        }`}
                    style={{ left: beat * beatWidth }}
                />
            ))}

            {/* Clips */}
            {track.clips.map((clip) => (
                <div
                    key={clip.id}
                    className="absolute top-2 bottom-2"
                    style={{
                        left: clip.start_time * beatWidth,
                        width: clip.duration * beatWidth - 2,
                    }}
                >
                    <TrackClip color={"rgba(255, 255, 255, 0.2)"} />
                </div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimelineGrid({
    tracks,
    beatsPerBar = 4,
    totalBars = 32,
    beatWidth = 48,
    trackHeight = 80,
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const totalBeats = totalBars * beatsPerBar;
    const contentWidth = totalBeats * beatWidth;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-zinc-950 select-none">
            {/* ── Header row ── */}
            <div className="flex flex-shrink-0 border-b border-white/10">
                {/* Corner cell */}
                <div
                    className="flex-shrink-0 bg-zinc-900/80 border-r border-white/10 flex items-center px-4"
                    style={{ width: LABEL_WIDTH, height: RULER_HEIGHT }}
                >
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                        Tracks
                    </span>
                </div>

                {/* Scrolling ruler — synced with content below */}
                <div className="overflow-hidden flex-1" ref={scrollRef}>
                    <Ruler
                        totalBars={totalBars}
                        beatsPerBar={beatsPerBar}
                        beatWidth={beatWidth}
                    />
                </div>
            </div>

            {/* ── Body: labels + scrollable content ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Track labels (fixed) */}
                <div
                    className="flex-shrink-0 border-r border-white/10 overflow-hidden"
                    style={{ width: LABEL_WIDTH }}
                >
                    {tracks.map((track, i) => (
                        <div
                            key={track.id}
                            className={`flex items-center px-4 gap-3 ${i < tracks.length - 1 ? "border-b border-white/[0.06]" : ""
                                }`}
                            style={{ height: trackHeight }}
                        >
                            {/* Color dot */}
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                }}
                            />
                            <span className="text-sm text-white/70 truncate font-medium">
                                {track.name}
                            </span>
                        </div>
                    ))}

                    {/* Add track button */}
                    <div
                        className="flex items-center px-4 cursor-pointer group"
                        style={{ height: 40 }}
                    >
                        <span className="text-xs text-white/25 group-hover:text-white/50 transition-colors">
                            + Add track
                        </span>
                    </div>
                </div>

                {/* Scrollable content */}
                <div
                    className="flex-1 overflow-x-auto overflow-y-hidden"
                    onScroll={(e) => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        }
                    }}
                >
                    <div style={{ width: contentWidth }}>
                        {tracks.map((track, i) => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                totalBeats={totalBeats}
                                beatWidth={beatWidth}
                                trackHeight={trackHeight}
                                beatsPerBar={beatsPerBar}
                                isLast={i === tracks.length - 1}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
