import { useEffect, useRef, useState } from "react";
import WorkspaceChannel, { getOrCreateSessionId } from "../services/signaling/workspaceChannel";
import { WorkspaceRtc } from "../services/transport/workspaceRtc";
import { useCursorSync } from "./useCursorSync";
import { useCursorEvents } from "./useCursorEvents";
import { useWorkspaceEvent } from "./useWorkspaceEvent";
import { RealtimeEvents } from "../events/events";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

export function useWorkspaceRealtime(workspaceId: string) {
    // sessionId is read from sessionStorage before the effect runs
    const sessionId = useRef(getOrCreateSessionId()).current;

    const [rtc, setRtc] = useState<WorkspaceRtc | null>(null);

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    useEffect(() => {
        const channel = new WorkspaceChannel(workspaceId).join();
        const r = new WorkspaceRtc(workspaceId, channel.sessionId);
        setRtc(r);

        (window as unknown as { __rtc?: WorkspaceRtc }).__rtc = r;

        return () => {
            r.destroy();
            setRtc(null);
            channel.leave();
            delete (window as unknown as { __rtc?: WorkspaceRtc }).__rtc;
        };
    }, [workspaceId]);

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
