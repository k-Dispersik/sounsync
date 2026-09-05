import type { Track } from "@/shared/types";
import { Skeleton } from "@/shared/ui";
import type { TimelineScale } from "../model/timeline";
import TrackRow from "./TrackRow";

interface Props {
    tracks: Track[];
    isLoading: boolean;
    totalBeats: number;
    beatWidth: number;
    beatsPerBar: number;
    pixelsPerMillisecond: number;
    scale: TimelineScale;
    hoveredBeat: number | null;
    hoveredTrackId: number | null;
    selectedBeat: number | null;
    selectedTrackId: number | null;
    onBeatHover: (beatIndex: number, trackId: number) => void;
    onBeatLeave: () => void;
    onBeatClick: (beatIndex: number, trackId: number, rowIndex: number) => void;
}

/**
 * The lanes, or a word about why there are none.
 *
 * The lanes, and the placeholders that stand in for them while the project is
 * on its way. The empty case is not here: it belongs outside the scrolling
 * area, where it can be centred on what the reader can actually see.
 */
export default function TrackLanes({ tracks, isLoading, ...rest }: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-20 w-full rounded-lg" count={4} />
            </div>
        );
    }

    return (
        <>
            {tracks.map((track, index) => (
                <TrackRow
                    key={track.id}
                    track={track}
                    isLast={index === tracks.length - 1}
                    {...rest}
                />
            ))}
        </>
    );
}
