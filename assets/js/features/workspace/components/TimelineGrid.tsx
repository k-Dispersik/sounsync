import { useRef } from "react";
import Ruler, { RULER_HEIGHT } from "./Ruler";
import TrackRow from "./TrackRow";
import type { Track } from "./TrackRow";
export type { Clip, Track } from "./TrackRow";

interface Props {
    tracks: Track[];
    isLoading: boolean;
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimelineGrid({
    tracks,
    isLoading,
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
                    {isLoading ? (
                        <div className="p-4 flex flex-col gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="skeleton h-6 w-full rounded" />
                            ))}
                        </div>
                    ) : (
                        tracks.map((track, i) => (
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
                                        backgroundColor: "rgba(255, 0, 255, 0.2)",
                                    }}
                                />
                                <span className="text-sm text-white/70 truncate font-medium">
                                    {track.name}
                                </span>
                            </div>
                        ))
                    )}

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
                        {isLoading ? (
                            <div className="flex flex-col gap-2 p-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="skeleton h-20 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            tracks.map((track, i) => (
                                <TrackRow
                                    key={track.id}
                                    track={track}
                                    totalBeats={totalBeats}
                                    beatWidth={beatWidth}
                                    trackHeight={trackHeight}
                                    beatsPerBar={beatsPerBar}
                                    isLast={i === tracks.length - 1}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
