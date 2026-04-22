import TrackClip from "./TrackClip";

export interface Clip {
    id: string;
    start_time: number; // seconds
    duration: number; // seconds
    settings: JSON;
    file_path: string;
}

export interface Track {
    id: string;
    name: string;
    clips: Clip[];
}

export default function TrackRow({
    track,
    totalBeats,
    beatWidth,
    trackHeight,
    beatsPerBar,
    isLast,
}: {
    track: Track;
    totalBeats: number;
    beatWidth: number;
    trackHeight: number;
    beatsPerBar: number;
    isLast: boolean;
}) {
    return (
        <div
            className={`relative flex-shrink-0 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
            style={{ height: trackHeight }}
        >
            {/* Beat / bar grid lines */}
            {Array.from({ length: totalBeats }, (_, i) => i).map((beat) => (
                <div
                    key={beat}
                    className={`absolute top-0 bottom-0 w-px ${beat % beatsPerBar === 0 ? "bg-white/[0.06]" : "bg-white/[0.03]"
                        }`}
                    style={{ left: beat * beatWidth }}
                />
            ))}

            {/* Clips */}
            {track.clips.map((clip) => (
                <div
                    key={clip.id}
                    className="absolute top-2 bottom-2"
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
