import { useState, useRef, type CSSProperties, useEffect } from "react";
import Ruler from "./Ruler";
import TrackRow from "./TrackRow";
import type { Track } from "../../../shared/types/index";
import { Trash2 } from "lucide-react";
import { deleteTrack } from "../api/tracks";

interface SelectedPosition {
    second: number;
    trackId: number | null;
    rowIndex: number | null;
}

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
    onTrackChanged: () => void;
}

export default function TimelineGrid({
    tracks,
    isLoading,
    beatsPerBar = 4,
    totalBars = 32,
    beatWidth = 48,
    trackHeight = 80,
    onTrackChanged,
}: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    // const [playheadPosition, setPlayheadPosition] = useState(0);
    const [hoveredSecond, setHoveredSecond] = useState<number | null>(null);
    const [hoveredTrackId, setHoveredTrackId] = useState<number | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);
    const totalBeats = totalBars * beatsPerBar;
    const contentWidth = totalBeats * beatWidth;

    const handleRemoveTrack = async (projectId: number, trackId: number) => {
        await deleteTrack(projectId, trackId);
        onTrackChanged();
    };

    const handleRulerSecondClick = (second: number) => {
        setSelectedPosition({ second, trackId: null, rowIndex: null });
    };

    const handleTrackSecondClick = (second: number, trackId: number, rowIndex: number) => {
        setSelectedPosition({ second, trackId, rowIndex });
    };

    const handleTrackSecondHover = (second: number, trackId: number) => {
        setHoveredSecond(second);
        setHoveredTrackId(trackId);
    };

    const handleSecondLeave = () => {
        setHoveredSecond(null);
        setHoveredTrackId(null);
    };

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setHoveredSecond((prev) => (prev !== null ? prev + 1 : null));
    //     }, 250);

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-zinc-950 select-none">
            {/* ── Header row ── */}
            <div className="flex flex-shrink-0 border-b border-white/10">
                {/* Corner cell */}
                <div
                    className="flex h-8 w-[168px] flex-shrink-0 items-center border-r border-white/10 bg-zinc-900/80 px-4"
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
                        hoveredSecond={hoveredSecond}
                        selectedSecond={selectedPosition?.second ?? null}
                        onSecondHover={(second) => {
                            setHoveredSecond(second);
                            setHoveredTrackId(null);
                        }}
                        onSecondLeave={handleSecondLeave}
                        onSecondClick={handleRulerSecondClick}
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-[168px] flex-shrink-0 overflow-hidden border-r border-white/10">
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
                                <Trash2
                                    onClick={() => handleRemoveTrack(track.project_id, track.id)}
                                    size={18}
                                    className="text-white/20 cursor-pointer hover:text-white/50 transition-colors" />

                                <span className="text-sm text-white/70 truncate font-medium">
                                    {`Track ${track.row_index + 1}`}
                                </span>
                            </div>
                        ))
                    )}
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
                    <div className="w-[var(--timeline-width)]" style={{ "--timeline-width": `${contentWidth}px` } as CSSProperties}>
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
                                    hoveredSecond={hoveredSecond}
                                    hoveredTrackId={hoveredTrackId}
                                    selectedSecond={selectedPosition?.second ?? null}
                                    selectedTrackId={selectedPosition?.trackId ?? null}
                                    onSecondHover={handleTrackSecondHover}
                                    onSecondLeave={handleSecondLeave}
                                    onSecondClick={handleTrackSecondClick}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
