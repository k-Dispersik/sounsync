import { useState } from "react";
import { useCursorSync } from "./useCursorSync";
import { useCursorEvents } from "./useCursorEvents";
import { useWorkspaceEvent } from "./useWorkspaceEvent";
import { RealtimeEvents } from "../events/events";
import { useRealtime } from "../contextProviders/RealtimeProvider";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

export function useWorkspaceRealtime(_workspaceId: string) {
    const { rtc, sessionId } = useRealtime();

    // ─── Cursor state ─────────────────────────────────────────────────────────
    const [cursors, setCursors] = useState<Record<string, CursorState>>({});

    const { sendMove, sendClick } = useCursorSync(rtc, sessionId, {
        onRemoteMove: (id, x, y) => {
            setCursors((prev) => ({ ...prev, [id]: { ...prev[id], x, y } }));
        },
        onRemoteClick: (id, x, y) => {
            setCursors((prev) => ({ ...prev, [id]: { ...prev[id], clicking: true } }));
            setTimeout(() => {
                setCursors((prev) => ({ ...prev, [id]: { ...prev[id], clicking: false } }));
            }, 200);
        },
    });

    useCursorEvents(sendMove, sendClick);

    // ─── Connected peers ──────────────────────────────────────────────────────
    const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());

    useWorkspaceEvent<{ session_id: string }>(
        RealtimeEvents.PEER_CONNECTED,
        ({ session_id }) => setConnectedPeers((prev) => new Set([...prev, session_id]))
    );

    useWorkspaceEvent<{ session_id: string }>(
        RealtimeEvents.PEER_DISCONNECTED,
        ({ session_id }) =>
            setConnectedPeers((prev) => {
                const next = new Set(prev);
                next.delete(session_id);
                return next;
            })
    );

    return {
        sessionId,
        cursors,
        connectedPeers,
        tracks: [] as never[],
        updateTrack: (_id: string, _data: unknown) => { },
    };
}
