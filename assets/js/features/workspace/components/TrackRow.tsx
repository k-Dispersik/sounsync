import type { CSSProperties } from "react";
import type { Track } from "../../../shared/types/index";
import TrackClip from "./TrackClip";
import { TrackCell } from "./TrackCell";

interface TrackRowProps {
    track: Track;
    totalBeats: number;
    beatWidth: number;
    beatsPerBar: number;
    pixelsPerMillisecond: number;
    isLast: boolean;
    hoveredBeat: number | null;
    hoveredTrackId: number | null;
    selectedBeat: number | null;
    selectedTrackId: number | null;
    onBeatHover: (beatIndex: number, trackId: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number, trackId: number, rowIndex: number) => void;
}

export default function TrackRow({
    track,
    totalBeats,
    beatWidth,
    beatsPerBar,
    pixelsPerMillisecond,
    isLast,
    hoveredBeat,
    hoveredTrackId,
    selectedBeat,
    selectedTrackId,
    onBeatHover,
    onBeatLeave,
    onBeatClick,
}: TrackRowProps) {
    const barEndLines = Array.from({ length: Math.floor(totalBeats / beatsPerBar) }, (_, bar) => (bar + 1) * beatsPerBar * beatWidth);
    const rowStyle = {
        "--track-row-height": `${80}px`,
        "--playhead-x": `${(hoveredBeat ?? selectedBeat ?? 0) * beatWidth}px`,
    } as CSSProperties;

    return (
        <div
            className={`relative h-[var(--track-row-height)] flex-shrink-0 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
            style={rowStyle}
        >
            {Array.from({ length: totalBeats }, (_, beatIndex) => (
                <TrackCell
                    key={`cell-${track.id}-${beatIndex}`}
                    track={track}
                    beatIndex={beatIndex}
                    beatWidth={beatWidth}
                    hoveredBeat={hoveredBeat}
                    hoveredTrackId={hoveredTrackId}
                    selectedBeat={selectedBeat}
                    selectedTrackId={selectedTrackId}
                    onBeatHover={onBeatHover}
                    onBeatLeave={onBeatLeave}
                    onBeatClick={onBeatClick}
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

            {barEndLines.map((x, index) => (
                <div
                    key={`bar-end-${track.id}-${index}`}
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-blue-950/90"
                    style={{ left: x - 1 }}
                />
            ))}

            {(hoveredBeat !== null || (selectedBeat !== null && selectedTrackId === track.id)) && (
                <div
                    className={`pointer-events-none absolute inset-y-0 z-10 w-px ${selectedBeat !== null
                        ? "bg-cyan-300/80"
                        : "bg-cyan-200/45"
                        }`}
                    style={{ left: "var(--playhead-x)" }}
                />
            )}

            {/* Clips */}
            {track.clips.map((clip) => (
                <TrackClip key={clip.id} color={"rgba(255, 0, 255, 0.2)"} clip={clip} pixelsPerMillisecond={pixelsPerMillisecond} />))}
        </div>
    );
}