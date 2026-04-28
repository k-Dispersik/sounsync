import { CSSProperties } from "react";
import type { Track } from "../../../shared/types/index";

interface TrackCellProps {
    track: Track;
    second: number;
    beatWidth: number;
    hoveredSecond: number | null;
    hoveredTrackId: number | null;
    selectedSecond: number | null;
    selectedTrackId: number | null;
    onSecondHover: (second: number, trackId: number) => void;
    onSecondLeave: () => void;
    onSecondClick: (second: number, trackId: number, rowIndex: number) => void;
}


export function TrackCell({ track,
    second,
    beatWidth,
    hoveredSecond,
    hoveredTrackId,
    selectedSecond,
    selectedTrackId,
    onSecondHover,
    onSecondLeave,
    onSecondClick
}: TrackCellProps) {
    const isHovered = hoveredSecond === second && hoveredTrackId === track.id;
    const isSelected = selectedSecond === second && selectedTrackId === track.id;
    const cellClassName = isSelected
        ? "bg-cyan-400/10"
        : isHovered
            ? "bg-cyan-200/10"
            : "bg-transparent";

    return (
        <button
            key={`cell-${track.id}-${second}`}
            type="button"
            aria-label={`Select second ${second + 1} on track ${track.row_index + 1}`}
            className={`absolute inset-y-0 z-0 w-[var(--beat-width)] cursor-pointer transition-colors ${cellClassName}`}
            style={{ "--beat-width": `${beatWidth}px`, left: second * beatWidth } as CSSProperties}
            onMouseEnter={() => onSecondHover(second, track.id)}
            onMouseLeave={onSecondLeave}
            onClick={() => onSecondClick(second, track.id, track.row_index)}
        />
    );
}