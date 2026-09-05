import { createLogger } from "@/shared/lib/logger";
import type { Track } from "@/shared/types";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { useTransportContext } from "../contextProviders/TransportProvider";
import { OPERATIONS } from "../model/operations";
import { clipInBeat } from "../model/timeline";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const log = createLogger("Shortcuts");

interface SelectedCell {
    trackId: number;
    startTimeMs: number;
}

/**
 * The keys a DAW is expected to have: space plays, M mutes, S solos, Delete
 * removes the clip under the cursor.
 *
 * M, S and Delete act on the selected cell, so the selection is the answer to
 * "which track?" — there is no second notion of a current track to keep in
 * step with it.
 */
export function useTimelineShortcuts(
    tracks: Track[],
    selectedCell: SelectedCell | null,
    millisecondsPerBeat: number,
) {
    const { isPlaying, play, pause, toggleTrackMute, toggleTrackSolo } = useTransportContext();
    const { sendOperation } = useRealtime();

    const deleteSelectedClip = () => {
        if (!selectedCell) return;

        const track = tracks.find((candidate) => candidate.id === selectedCell.trackId);
        const clip = track
            ? clipInBeat(track.clips, selectedCell.startTimeMs, millisecondsPerBeat)
            : null;

        if (!clip) return;

        sendOperation(OPERATIONS.CLIP_DELETE, { clip_id: clip.id, track_id: track?.id }).catch(
            (error: unknown) => log.error(`could not delete clip ${clip.id}`, error),
        );
    };

    useKeyboardShortcuts({
        "play-pause": () => (isPlaying ? pause() : play()),
        "toggle-mute": () => selectedCell && toggleTrackMute(selectedCell.trackId),
        "toggle-solo": () => selectedCell && toggleTrackSolo(selectedCell.trackId),
        delete: deleteSelectedClip,
    });
}
