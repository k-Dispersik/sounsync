import { CSSProperties } from "react";
import type { Track } from "../../../shared/types/index";

interface TrackCellProps {
    track: Track;
    beatIndex: number;
    beatWidth: number;
    hoveredBeat: number | null;
    hoveredTrackId: number | null;
    selectedBeat: number | null;
    selectedTrackId: number | null;
    onBeatHover: (beatIndex: number, trackId: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number, trackId: number, rowIndex: number) => void;
}

export function TrackCell({
    track,
    beatIndex,
    beatWidth,
    hoveredBeat,
    hoveredTrackId,
    selectedBeat,
    selectedTrackId,
    onBeatHover,
    onBeatLeave,
    onBeatClick,
}: TrackCellProps) {
    const isHovered = hoveredBeat === beatIndex && hoveredTrackId === track.id;
    const isSelected = selectedBeat === beatIndex && selectedTrackId === track.id;
    const cellClassName = isSelected
        ? "bg-cyan-400/10"
        : isHovered
          ? "bg-cyan-200/10"
          : "bg-transparent";

    return (
        <button
            key={`cell-${track.id}-${beatIndex}`}
            type="button"
            aria-label={`Select beat ${beatIndex + 1} on track ${track.row_index + 1}`}
            className={`absolute inset-y-0 z-0 w-[var(--beat-width)] cursor-pointer transition-colors ${cellClassName}`}
            style={
                { "--beat-width": `${beatWidth}px`, left: beatIndex * beatWidth } as CSSProperties
            }
            onMouseEnter={() => onBeatHover(beatIndex, track.id)}
            onMouseLeave={onBeatLeave}
            onClick={() => onBeatClick(beatIndex, track.id, track.row_index)}
        />
    );
}
