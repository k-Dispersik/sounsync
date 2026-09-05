import { Plus, Mic } from "lucide-react";

import { createLogger } from "@/shared/lib/logger";
import type { Track } from "@/shared/types";
import { useClipModal } from "../contextProviders/ClipModalProvider";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { OPERATIONS } from "../model/operations";

const log = createLogger("Toolbar");

interface Props {
    projectId: number;
    tracks: Track[];
    selectedCell: { trackId: number; beatIndex: number; startTimeMs: number } | null;
}

export default function WorkspaceToolbar({ projectId, tracks, selectedCell }: Props) {
    const { openCreateClip } = useClipModal();
    const { sendOperation } = useRealtime();

    // The new track arrives back through the channel, along with everyone
    // else's edits, so there is nothing to do here on success.
    const handleAddTrack = () => {
        sendOperation(OPERATIONS.TRACK_CREATE, { row_index: tracks.length + 1 }).catch(
            (error: unknown) => log.error("could not add a track", error),
        );
    };

    return (
        <div className="flex items-center gap-4 px-4 h-9 bg-base-200 border-b border-base-content/[0.07] flex-shrink-0">
            <button
                type="button"
                className="flex items-center gap-1.5 rounded text-xs text-muted hover:text-default transition-colors focus-ring"
                onClick={handleAddTrack}
            >
                <Plus size={13} />
                Add Track
            </button>
            <div className="w-px h-4 bg-base-content/10" />
            <button
                type="button"
                disabled
                title="Recording is not available yet"
                className="flex items-center gap-1.5 rounded text-xs text-muted transition-colors focus-ring disabled:opacity-40"
            >
                <Mic size={13} />
                Record
            </button>
            {selectedCell && (
                <button
                    type="button"
                    className="flex items-center gap-1.5 rounded text-xs text-muted hover:text-default transition-colors focus-ring"
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
