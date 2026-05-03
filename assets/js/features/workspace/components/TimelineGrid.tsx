import { type CSSProperties } from "react";
import Ruler from "./Ruler";
import TrackRow from "./TrackRow";
import type { Track } from "../../../shared/types/index";
import { Trash2 } from "lucide-react";
import { deleteTrack } from "../api/tracks";
import WorkspaceToolbar from "./WorkspaceToolbar";
import { useTimelineGrid } from "js/features/workspace/hooks/useTimelineGrid";

interface Props {
    projectId: number;
    tracks: Track[];
    isLoading: boolean;
    /** Pixel width of one beat — default 48 */
    beatWidth?: number;
    timeSignature?: string;
    BPM?: number;
    timelineLengthMs?: number;
    onTrackChanged: () => void;
}

export default function TimelineGrid({
    projectId,
    tracks,
    isLoading,
    beatWidth = 48,
    timeSignature,
    BPM,
    timelineLengthMs,
    onTrackChanged,
}: Props) {
    const {
        scrollRef,
        hoveredBeat,
        hoveredTrackId,
        selectedPosition,
        selectedCell,
        beatsPerBar,
        totalBars,
        totalBeats,
        contentWidth,
        pixelsPerMillisecond,
        millisecondsPerBeat,
        handleRulerBeatClick,
        handleTrackBeatClick,
        handleTrackBeatHover,
        handleRulerBeatHover,
        handleBeatLeave,
        handleOpenCreateClipModal,
    } = useTimelineGrid({ tracks, BPM, beatWidth, timelineLengthMs, timeSignature });

    const handleRemoveTrack = async (trackId: number) => {
        await deleteTrack(projectId, trackId);
        onTrackChanged();
    };

    // const barsPerSecond = 60 / BPM;

    return (
        <>
            <WorkspaceToolbar
                projectId={projectId}
                tracks={tracks}
                selectedCell={selectedCell}
                openCreateClipModal={handleOpenCreateClipModal}
                onTrackChanged={onTrackChanged}
            />
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
                            millisecondsPerBeat={millisecondsPerBeat}
                            hoveredBeat={hoveredBeat}
                            selectedBeat={selectedPosition?.beatIndex ?? null}
                            onBeatHover={handleRulerBeatHover}
                            onBeatLeave={handleBeatLeave}
                            onBeatClick={handleRulerBeatClick}
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
                                    style={{ height: 80 }}
                                >

                                    <Trash2
                                        onClick={() => handleRemoveTrack(track.id)}
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
                                        beatsPerBar={beatsPerBar}
                                        pixelsPerMillisecond={pixelsPerMillisecond}
                                        isLast={i === tracks.length - 1}
                                        hoveredBeat={hoveredBeat}
                                        hoveredTrackId={hoveredTrackId}
                                        selectedBeat={selectedPosition?.beatIndex ?? null}
                                        selectedTrackId={selectedPosition?.trackId ?? null}
                                        onBeatHover={handleTrackBeatHover}
                                        onBeatLeave={handleBeatLeave}
                                        onBeatClick={handleTrackBeatClick}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
