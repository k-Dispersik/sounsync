import type { CSSProperties } from "react";
import type { Track } from "../../../shared/types/index";
import TrackClip from "./TrackClip";
import { TrackCell } from "./TrackCell";

interface TrackRowProps {
    track: Track;
    totalBeats: number;
    beatWidth: number;
    trackHeight: number;
    beatsPerBar: number;
    isLast: boolean;
    hoveredSecond: number | null;
    hoveredTrackId: number | null;
    selectedSecond: number | null;
    selectedTrackId: number | null;
    onSecondHover: (second: number, trackId: number) => void;
    onSecondLeave: () => void;
    onSecondClick: (second: number, trackId: number, rowIndex: number) => void;
}

export default function TrackRow({
    track,
    totalBeats,
    beatWidth,
    trackHeight,
    beatsPerBar,
    isLast,
    hoveredSecond,
    hoveredTrackId,
    selectedSecond,
    selectedTrackId,
    onSecondHover,
    onSecondLeave,
    onSecondClick,
}: TrackRowProps) {
    const rowStyle = {
        "--track-row-height": `${trackHeight}px`,
        "--playhead-x": `${(hoveredSecond ?? selectedSecond ?? 0) * beatWidth}px`,
    } as CSSProperties;

    return (
        <div
            className={`relative h-[var(--track-row-height)] flex-shrink-0 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
            style={rowStyle}
        >
            {Array.from({ length: totalBeats }, (_, second) => (
                <TrackCell
                    key={`cell-${track.id}-${second}`}
                    track={track}
                    second={second}
                    beatWidth={beatWidth}
                    hoveredSecond={hoveredSecond}
                    hoveredTrackId={hoveredTrackId}
                    selectedSecond={selectedSecond}
                    selectedTrackId={selectedTrackId}
                    onSecondHover={onSecondHover}
                    onSecondLeave={onSecondLeave}
                    onSecondClick={onSecondClick}
                />
            ))}

            {Array.from({ length: totalBeats }, (_, i) => i).map((beat) => {
                const isBar = beat % beatsPerBar === 0;
                return (
                    <div
                        key={`grid-line-${track.id}-${beat}`}
                        className={`pointer-events-none absolute top-0 bottom-0 w-px ${isBar ? "bg-white/[0.06]" : "bg-white/[0.03]"
                            }`}
                        style={{ left: beat * beatWidth }}
                    />
                );
            })}

            {(hoveredSecond !== null || (selectedSecond !== null && selectedTrackId === track.id)) && (
                <div
                    className={`pointer-events-none absolute inset-y-0 z-10 w-px ${selectedSecond !== null
                        ? "bg-cyan-300/80"
                        : "bg-cyan-200/45"
                        }`}
                    style={{ left: "var(--playhead-x)" }}
                />
            )}

            {/* Clips */}
            {track.clips.map((clip) => (
                <TrackClip key={clip.id} color={"rgba(255, 0, 255, 0.2)"} clip={clip} beatWidth={beatWidth} />))}
        </div>
    );
}