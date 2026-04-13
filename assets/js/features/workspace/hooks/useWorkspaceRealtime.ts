import { useEffect, useRef, useState } from "react";
import { WorkspaceChannel } from "../services/signaling/workspaceChannel";
import { WorkspaceRtc } from "../services/transport/workspaceRtc";
import { useCursorSync } from "./useCursorSync";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

/**
 * Top-level hook that initialises the workspace realtime connection and
 * exposes a clean API to UI components.
 *
 * Layering: UI → useWorkspaceRealtime → useCursorSync → useWorkspaceBroadcast / useWorkspaceEvent
 *                                                      → WorkspaceRtc (WebRTC)
 *                                                      → WorkspaceChannel (Phoenix)
 */
export function useWorkspaceRealtime(workspaceId: string) {
    // Stable refs — created once, never recreated on re-render
    const channelRef = useRef<WorkspaceChannel | null>(null);
    const rtcRef = useRef<WorkspaceRtc | null>(null);

    if (!channelRef.current) {
        channelRef.current = new WorkspaceChannel(workspaceId).join();
    }
    if (!rtcRef.current) {
        rtcRef.current = new WorkspaceRtc(workspaceId, channelRef.current.sessionId);
    }

    const channel = channelRef.current;
    const rtc = rtcRef.current;
    const sessionId = channel.sessionId;

    // ─── Cursor state (lifted from WorkspaceCursor component) ─────────────────
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

    // ─── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            rtcRef.current?.destroy();
            channelRef.current?.leave();
        };
    }, []);

    return {
        sessionId,
        // Cursor API
        cursors,
        sendCursor: sendMove,
        sendCursorClick: sendClick,
        // Track API (reserved for future features)
        tracks: [] as never[],
        updateTrack: (_id: string, _data: unknown) => { },
    };
}
