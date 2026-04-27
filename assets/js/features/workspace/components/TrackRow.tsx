import TrackClip from "./TrackClip";
import type { Track } from "../../../shared/types/index";

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
}: {
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
}) {
    return (
        <div
            className={`relative flex-shrink-0 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
            style={{ height: trackHeight }}
        >
            {/* Clickable second cells */}
            {Array.from({ length: totalBeats }, (_, second) => {
                const isHovered = hoveredSecond === second && hoveredTrackId === track.id;
                const isSelected = selectedSecond === second && selectedTrackId === track.id;

                return (
                    <button
                        key={`cell-${track.id}-${second}`}
                        type="button"
                        aria-label={`Select second ${second + 1} on track ${track.row_index + 1}`}
                        className={`absolute inset-y-0 z-0 cursor-pointer transition-colors ${isSelected
                            ? "bg-cyan-400/10"
                            : isHovered
                                ? "bg-cyan-200/10"
                                : "bg-transparent"
                            }`}
                        style={{ left: second * beatWidth, width: beatWidth }}
                        onMouseEnter={() => onSecondHover(second, track.id)}
                        onMouseLeave={onSecondLeave}
                        onClick={() => onSecondClick(second, track.id, track.row_index)}
                    />
                );
            })}

            {/* Beat / bar grid lines */}
            {Array.from({ length: totalBeats }, (_, i) => i).map((beat) => (
                <div
                    key={beat}
                    className={`pointer-events-none absolute top-0 bottom-0 w-px ${beat === 0 ? "bg-white/[0.06]" : "bg-white/[0.03]"
                        }`}
                    style={{ left: beat * beatWidth }}
                />
            ))}

            {(hoveredSecond !== null || (selectedSecond !== null && selectedTrackId === track.id)) && (
                <div
                    className={`pointer-events-none absolute inset-y-0 z-10 w-px ${selectedSecond !== null
                        ? "bg-cyan-300/80"
                        : "bg-cyan-200/45"
                        }`}
                    style={{ left: (hoveredSecond ?? selectedSecond ?? 0) * beatWidth }}
                />
            )}

            {/* Clips */}
            {track.clips.map((clip) => (
                <div
                    key={clip.id}
                    className="absolute top-2 bottom-2 z-20"
                    style={{
                        left: clip.start_time * beatWidth,
                        width: clip.duration * beatWidth - 2,
                    }}
                >
                    <TrackClip color={"rgba(255, 0, 255, 0.2)"} />
                </div>
            ))}
        </div>
    );
}
