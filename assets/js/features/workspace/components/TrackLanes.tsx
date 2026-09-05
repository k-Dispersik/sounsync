import type { Track } from "@/shared/types";
import { EmptyState, Skeleton } from "@/shared/ui";
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
 * Holds all three states of the lane area — loading, empty and populated — so
 * the grid does not have to. The arm that says "nothing here yet" is the one
 * that gets forgotten when it lives three levels inside a ternary.
 */
export default function TrackLanes({ tracks, isLoading, ...rest }: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-20 w-full rounded-lg" count={4} />
            </div>
        );
    }

    if (tracks.length === 0) {
        return (
            <EmptyState
                title="No tracks yet"
                description="Add a track to start placing clips on the timeline."
                className="h-full"
            />
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
