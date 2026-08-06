import { Plus, Mic } from "lucide-react";
import { createTrack } from "../api/tracks";
import type { Track } from "@/shared/types";
import { useClipModal } from "../contextProviders/ClipModalProvider";

interface Props {
    projectId: number;
    tracks: Track[];
    selectedCell: { trackId: number; beatIndex: number; startTimeMs: number } | null;
    onTrackAdded: (track: Track) => void;
}

export default function WorkspaceToolbar({ projectId, tracks, selectedCell, onTrackAdded }: Props) {
    const { openCreateClip } = useClipModal();

    const handleAddTrack = async () => {
        const track = await createTrack(projectId, { row: tracks.length + 1 });
        onTrackAdded(track);
    };

    return (
        <div className="flex items-center gap-4 px-4 h-9 bg-base-200 border-b border-base-content/[0.07] flex-shrink-0">
            <button
                className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content/80 transition-colors"
                onClick={handleAddTrack}
            >
                <Plus size={13} />
                Add Track
            </button>
            <div className="w-px h-4 bg-base-content/10" />
            <button className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content/80 transition-colors">
                <Mic size={13} />
                Record
            </button>
            {selectedCell && (
                <button
                    className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content/80 transition-colors"
                    onClick={() =>
                        openCreateClip(projectId, selectedCell.trackId, selectedCell.startTimeMs)
                    }
                >
                    <Plus size={13} />
                    Add Clip
                </button>
            )}
        </div>
    );
}
