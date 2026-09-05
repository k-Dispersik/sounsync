import { Trash2 } from "lucide-react";

import type { Track } from "@/shared/types";
import { IconButton, Skeleton } from "@/shared/ui";
import TrackLevelButtons from "./TrackLevelButtons";

const LANE_HEIGHT = 80;

interface Props {
    tracks: Track[];
    isLoading: boolean;
    onRemove: (trackId: number) => void;
}

/**
 * The column of track names to the left of the lanes.
 *
 * Its rows have to line up with the lanes exactly, so both use the same row
 * height; while the project is loading it shows placeholders of that height
 * rather than nothing, which keeps the two columns from jumping apart.
 */
export default function TrackHeads({ tracks, isLoading, onRemove }: Props) {
    if (isLoading) {
        return (
            <div className="w-[168px] flex-shrink-0 overflow-hidden border-r border-base-content/10">
                <div className="flex flex-col gap-2 p-4">
                    <Skeleton className="h-6 w-full" count={4} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-[168px] flex-shrink-0 overflow-hidden border-r border-base-content/10">
            {tracks.map((track, index) => (
                <div
                    key={track.id}
                    className={`flex items-center gap-3 px-4 ${
                        index < tracks.length - 1 ? "border-b border-base-content/10" : ""
                    }`}
                    style={{ height: LANE_HEIGHT }}
                >
                    <IconButton
                        size="sm"
                        label={`Delete track ${track.row_index + 1}`}
                        icon={<Trash2 size={15} />}
                        className="hover:text-error"
                        onClick={() => onRemove(track.id)}
                    />

                    <span className="flex-1 truncate text-sm font-medium text-base-content/70">
                        {`Track ${track.row_index + 1}`}
                    </span>

                    <TrackLevelButtons trackId={track.id} />
                </div>
            ))}
        </div>
    );
}
