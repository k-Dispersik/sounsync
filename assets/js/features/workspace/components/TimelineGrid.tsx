import { type CSSProperties } from "react";
import Ruler from "./Ruler";
import TrackRow from "./TrackRow";
import type { Project, Track } from "../../../shared/types/index";
import { Trash2 } from "lucide-react";
import { deleteTrack } from "../api/tracks";
import WorkspaceToolbar from "./WorkspaceToolbar";
import { useTimeline } from "js/features/workspace/hooks/useTimeline";
import { useTimelineSelection } from "js/features/workspace/hooks/useTimelineSelection";
import { RealtimeEvents } from "../events/events";
import { useWorkspaceEvent } from "../hooks/useWorkspaceEvent";
import { useRealtime } from "../contextProviders/RealtimeProvider";

interface Props {
    project: Project | null;
    isLoading: boolean;
    /** Pixel width of one beat — default 48 */
    beatWidth?: number;
    onTrackAdded: (track: Track) => void;
    onTrackRemoved: (trackId: number) => void;
}

export default function TimelineGrid({
    project,
    isLoading,
    beatWidth = 48,
    onTrackAdded,
    onTrackRemoved,
}: Props) {
    const tracks = project?.tracks ?? [];
    const {
        scrollRef,
        hoveredBeat,
        hoveredTrackId,
        beatsPerBar,
        totalBeats,
        contentWidth,
        gridBeatWidth,
        pixelsPerMillisecond,
        handleTrackBeatHover,
        handleRulerBeatHover,
        handleBeatLeave,
        handleOpenCreateClipModal,
        barEndLines,
    } = useTimeline({
        project,
        beatWidth,
    });
    const {
        selectedPosition,
        selectedCell: rawSelectedCell,
        handleRulerBeatClick,
        handleTrackBeatClick,
    } = useTimelineSelection();

    const millisecondsPerBeat = gridBeatWidth / pixelsPerMillisecond;
    const selectedCell = rawSelectedCell
        ? { ...rawSelectedCell, startTimeMs: rawSelectedCell.beatIndex * millisecondsPerBeat }
        : null;

    const { broadcast } = useRealtime();

    const handleRemoveTrack = async (trackId: number) => {
        if (!project) {
            return;
        }

        await deleteTrack(project.id, trackId);
        onTrackRemoved(trackId);
        broadcast(RealtimeEvents.TRACK_REMOVED, { track_id: trackId });
    };

    useWorkspaceEvent<{ track_id: number }>(RealtimeEvents.TRACK_REMOVED, ({ track_id }) => {
        onTrackRemoved(track_id);
        console.log(`Track ${track_id} removed by another user`);
    });

    const handleTrackAdded = (track: Track) => {
        onTrackAdded(track);
        broadcast(RealtimeEvents.TRACK_ADDED, { track });
    };

    useWorkspaceEvent<{ track: Track }>(RealtimeEvents.TRACK_ADDED, ({ track }) => {
        onTrackAdded(track);
    });

    return (
        <>
            <WorkspaceToolbar
                projectId={Number(project?.id)}
                tracks={tracks}
                selectedCell={selectedCell}
                onTrackAdded={handleTrackAdded}
            />
            <div className="flex flex-col h-full overflow-hidden bg-base-100 select-none">
                {/* ── Header row ── */}
                <div className="flex flex-shrink-0 border-b border-base-content/10">
                    {/* Corner cell */}
                    <div className="flex h-8 w-[168px] flex-shrink-0 items-center border-r border-base-content/10 bg-base-300/80 px-4">
                        <span className="text-[10px] uppercase tracking-widest text-base-content/30 font-semibold">
                            Tracks
                        </span>
                    </div>

                    {/* Scrolling ruler — synced with content below */}
                    <div className="overflow-hidden flex-1" ref={scrollRef}>
                        <Ruler
                            totalBeats={totalBeats}
                            beatsPerBar={beatsPerBar}
                            beatWidth={gridBeatWidth}
                            contentWidth={contentWidth}
                            pixelsPerMillisecond={pixelsPerMillisecond}
                            hoveredBeat={hoveredBeat}
                            selectedBeat={selectedPosition?.beatIndex ?? null}
                            onBeatHover={handleRulerBeatHover}
                            onBeatLeave={handleBeatLeave}
                            onBeatClick={handleRulerBeatClick}
                        />
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-[168px] flex-shrink-0 overflow-hidden border-r border-base-content/10">
                        {isLoading ? (
                            <div className="p-4 flex flex-col gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="skeleton h-6 w-full rounded" />
                                ))}
                            </div>
                        ) : (
                            project?.tracks.map((track, i) => (
                                <div
                                    key={track.id}
                                    className={`flex items-center px-4 gap-3 ${i < project?.tracks.length - 1 ? "border-b border-base-content/[0.06]" : ""}
                                        }`}
                                    style={{ height: 80 }}
                                >
                                    <Trash2
                                        onClick={() => handleRemoveTrack(track.id)}
                                        size={18}
                                        className="text-base-content/20 cursor-pointer hover:text-base-content/50 transition-colors"
                                    />

                                    <span className="text-sm text-base-content/70 truncate font-medium">
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
                        <div
                            className="w-[var(--timeline-width)]"
                            style={{ "--timeline-width": `${contentWidth}px` } as CSSProperties}
                        >
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
                                        beatWidth={gridBeatWidth}
                                        beatsPerBar={beatsPerBar}
                                        barEndLines={barEndLines}
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
