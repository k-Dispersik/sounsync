import { useCallback, useRef } from "react";

import { RealtimeEvents } from "../events/events";
import type { DomainCursor } from "../model/cursor";
import type { WorkspaceRtc } from "../services/transport/workspaceRtc";
import { useWorkspaceBroadcast } from "./useWorkspaceBroadcast";
import { useWorkspaceEvent } from "./useWorkspaceEvent";

interface CursorPayload extends DomainCursor {
    session_id: string;
}

export interface CursorCallbacks {
    onRemoteMove: (sessionId: string, cursor: DomainCursor) => void;
    onRemoteClick: (sessionId: string) => void;
}

/**
 * Sends and receives pointer positions over WebRTC.
 *
 * Positions are times and track ids rather than pixels, so a peer's cursor
 * points at the same beat on every screen. Losing one of these costs a frame,
 * which is why they stay on the unreliable transport while edits do not.
 */
export function useCursorSync(
    rtc: WorkspaceRtc | null,
    sessionId: string,
    callbacks: CursorCallbacks,
) {
    const { broadcast } = useWorkspaceBroadcast(rtc);

    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    const sendMove = useCallback(
        (cursor: DomainCursor) => {
            broadcast(RealtimeEvents.CURSOR_MOVE, { session_id: sessionId, ...cursor });
        },
        [broadcast, sessionId],
    );

    const sendClick = useCallback(
        (cursor: DomainCursor) => {
            broadcast(RealtimeEvents.CURSOR_CLICK, { session_id: sessionId, ...cursor });
        },
        [broadcast, sessionId],
    );

    useWorkspaceEvent<CursorPayload>(
        RealtimeEvents.CURSOR_MOVE,
        useCallback(
            ({ session_id, time_ms, track_id }: CursorPayload) => {
                if (session_id === sessionId) return;
                callbacksRef.current.onRemoteMove(session_id, { time_ms, track_id });
            },
            [sessionId],
        ),
    );

    useWorkspaceEvent<CursorPayload>(
        RealtimeEvents.CURSOR_CLICK,
        useCallback(
            ({ session_id }: CursorPayload) => {
                if (session_id === sessionId) return;
                callbacksRef.current.onRemoteClick(session_id);
            },
            [sessionId],
        ),
    );

    return { sendMove, sendClick };
}
