import { Plus, Mic } from "lucide-react";
import { createTrack } from "../api/tracks";
import type { Track } from "../../../shared/types/index";

interface Props {
    projectId: number;
    tracks: Track[];
    selectedCell: { trackId: number; second: number } | null;
    openCreateClipModal: (trackId: number, second: number) => void;
    onTrackChanged: () => void;
}

export default function WorkspaceToolbar({ projectId, tracks, selectedCell, openCreateClipModal, onTrackChanged }: Props) {
    const handleAddTrack = async () => {
        await createTrack(projectId, { row: tracks.length + 1 });
        onTrackChanged();
    };



    return (
        <div className="flex items-center gap-4 px-4 h-9 bg-[#0d1117] border-b border-white/[0.07] flex-shrink-0">
            <button
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                onClick={handleAddTrack}
            >
                <Plus size={13} />
                Add Track
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                <Mic size={13} />
                Record
            </button>
            {selectedCell && (
                <button
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
                    onClick={() => openCreateClipModal(selectedCell.trackId, selectedCell.second)}
                >
                    <Plus size={13} />
                    Add Clip
                </button>
            )}

        </div>
    );
}
