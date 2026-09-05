import { type CSSProperties, useMemo, useRef } from "react";
import Ruler from "./Ruler";
import type { Project } from "@/shared/types";
import Playhead from "./Playhead";
import TrackHeads from "./TrackHeads";
import TrackLanes from "./TrackLanes";
import WorkspaceCursor from "./WorkspaceCursor";
import WorkspaceToolbar from "./WorkspaceToolbar";
import { useTimeline } from "@/features/workspace/hooks/useTimeline";
import { useTimelineSelection } from "@/features/workspace/hooks/useTimelineSelection";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { useTransportContext } from "../contextProviders/TransportProvider";
import type { TimelineSurface } from "../model/cursor";
import { OPERATIONS } from "../model/operations";
import { useTimelineShortcuts } from "../hooks/useTimelineShortcuts";
import { useWorkspaceRealtime } from "../hooks/useWorkspaceRealtime";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("TimelineGrid");

// Kept in step with the row height in TrackRow; the cursor layer needs to know
// it to place a pointer in the right lane.
const LANE_HEIGHT = 80;

interface Props {
    project: Project | null;
    isLoading: boolean;
    /** Pixel width of one beat — default 48 */
    beatWidth?: number;
}

export default function TimelineGrid({ project, isLoading, beatWidth = 48 }: Props) {
    // Memoised because the cursor surface is derived from it: a fresh empty
    // array on every render would rebuild the surface, and with it every peer
    // cursor, sixty times a second.
    const tracks = useMemo(() => project?.tracks ?? [], [project?.tracks]);
    const {
        scale,
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
        ? {
              ...rawSelectedCell,
              // Whole milliseconds: that is what the clip is stored in, and a
              // fractional beat boundary is not a different moment in the music.
              startTimeMs: Math.round(rawSelectedCell.beatIndex * millisecondsPerBeat),
          }
        : null;

    const { sendOperation } = useRealtime();
    useTimelineShortcuts(tracks, selectedCell, millisecondsPerBeat);
    const selectedBeat = selectedPosition?.beatIndex ?? null;
    const selectedTrackId = selectedPosition?.trackId ?? null;

    const surface: TimelineSurface = useMemo(
        () => ({
            pixelsPerMillisecond,
            laneHeight: LANE_HEIGHT,
            trackTops: Object.fromEntries(
                tracks.map((track, index) => [track.id, index * LANE_HEIGHT]),
            ),
        }),
        [pixelsPerMillisecond, tracks],
    );

    const { cursors, pointerHandlers } = useWorkspaceRealtime(surface);
    const { player, setPosition } = useTransportContext();
    const contentRef = useRef<HTMLDivElement>(null);

    // The ruler says "jump to beat N", so it had better jump: clicking it
    // selects the beat and moves the playhead there.
    const handleRulerSeek = (beatIndex: number) => {
        handleRulerBeatClick(beatIndex);
        setPosition(beatIndex * millisecondsPerBeat);
    };

    // Tracks appearing and disappearing now arrive as operations on the
    // channel, so the grid only has to ask; the answer updates the project for
    // everyone at once.
    const handleRemoveTrack = (trackId: number) => {
        sendOperation(OPERATIONS.TRACK_DELETE, { track_id: trackId }).catch((error: unknown) =>
            log.error(`could not remove track ${trackId}`, error),
        );
    };

    return (
        <>
            <WorkspaceToolbar
                projectId={Number(project?.id)}
                tracks={tracks}
                selectedCell={selectedCell}
            />
            <div className="flex flex-col h-full overflow-hidden bg-base-100 select-none">
                {/* ── Header row ── */}
                <div className="flex flex-shrink-0 border-b border-base-content/10">
                    {/* Corner cell */}
                    <div className="flex h-8 w-[168px] flex-shrink-0 items-center border-r border-base-content/10 bg-base-300/80 px-4">
                        <span className="text-[10px] uppercase tracking-widest text-subtle font-semibold">
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
                            selectedBeat={selectedBeat}
                            onBeatHover={handleRulerBeatHover}
                            onBeatLeave={handleBeatLeave}
                            onBeatClick={handleRulerSeek}
                        />
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <TrackHeads
                        tracks={tracks}
                        isLoading={isLoading}
                        onRemove={handleRemoveTrack}
                    />

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
                            ref={contentRef}
                            className="relative w-[var(--timeline-width)]"
                            style={{ "--timeline-width": `${contentWidth}px` } as CSSProperties}
                            onMouseMove={pointerHandlers.onMouseMove}
                            onClick={pointerHandlers.onClick}
                        >
                            <WorkspaceCursor cursors={cursors} surface={surface} />
                            <Playhead
                                player={player}
                                pixelsPerMillisecond={pixelsPerMillisecond}
                                surfaceRef={contentRef}
                            />
                            <TrackLanes
                                tracks={tracks}
                                isLoading={isLoading}
                                totalBeats={totalBeats}
                                beatWidth={gridBeatWidth}
                                beatsPerBar={beatsPerBar}
                                pixelsPerMillisecond={pixelsPerMillisecond}
                                scale={scale}
                                hoveredBeat={hoveredBeat}
                                hoveredTrackId={hoveredTrackId}
                                selectedBeat={selectedBeat}
                                selectedTrackId={selectedTrackId}
                                onBeatHover={handleTrackBeatHover}
                                onBeatLeave={handleBeatLeave}
                                onBeatClick={handleTrackBeatClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
