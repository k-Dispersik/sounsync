import { useCallback, useRef } from "react";
import { RealtimeEvents } from "../events/events";
import { useWorkspaceEvent } from "./useWorkspaceEvent";
import { useWorkspaceBroadcast } from "./useWorkspaceBroadcast";
import type { WorkspaceRtc } from "../services/transport/workspaceRtc";

interface CursorMovePayload {
    session_id: string;
    x: number;
    y: number;
}

interface CursorClickPayload {
    session_id: string;
    x: number;
    y: number;
}

export interface CursorCallbacks {
    onRemoteMove: (sessionId: string, x: number, y: number) => void;
    onRemoteClick: (sessionId: string, x: number, y: number) => void;
}

/**
 * Feature hook that encapsulates all realtime cursor logic.
 *
 * Exposes `sendMove` and `sendClick` for outgoing events, and
 * subscribes to remote cursor events via the provided callbacks.
 */
export function useCursorSync(
    rtc: WorkspaceRtc,
    sessionId: string,
    callbacks: CursorCallbacks
) {
    const { broadcast } = useWorkspaceBroadcast(rtc);

    // Keep a stable ref to the latest callbacks to avoid stale closures
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    const sendMove = useCallback(
        (x: number, y: number) => {
            broadcast(RealtimeEvents.CURSOR_MOVE, { session_id: sessionId, x, y });
        },
        [broadcast, sessionId]
    );

    const sendClick = useCallback(
        (x: number, y: number) => {
            broadcast(RealtimeEvents.CURSOR_CLICK, { session_id: sessionId, x, y });
        },
        [broadcast, sessionId]
    );

    useWorkspaceEvent<CursorMovePayload>(
        RealtimeEvents.CURSOR_MOVE,
        useCallback(
            ({ session_id, x, y }: CursorMovePayload) => {
                if (session_id === sessionId) return;
                callbacksRef.current.onRemoteMove(session_id, x, y);
            },
            [sessionId]
        )
    );

    useWorkspaceEvent<CursorClickPayload>(
        RealtimeEvents.CURSOR_CLICK,
        useCallback(
            ({ session_id, x, y }: CursorClickPayload) => {
                if (session_id === sessionId) return;
                callbacksRef.current.onRemoteClick(session_id, x, y);
            },
            [sessionId]
        )
    );

    return { sendMove, sendClick };
}
