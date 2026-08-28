import { useCallback, useMemo, useState } from "react";

import { useRealtime } from "../contextProviders/RealtimeProvider";
import { RealtimeEvents } from "../events/events";
import type { DomainCursor, TimelineSurface } from "../model/cursor";
import { useCursorEvents } from "./useCursorEvents";
import { useCursorSync } from "./useCursorSync";
import { useWorkspaceEvent } from "./useWorkspaceEvent";

const CLICK_FLASH_MS = 200;

/**
 * The ephemeral half of realtime: who is pointing where.
 *
 * Cursors are held per session and in domain coordinates; turning them into
 * pixels is the timeline's job, because only it knows what it is drawing with.
 */
export function useWorkspaceRealtime(surface: TimelineSurface) {
    const { rtc, sessionId } = useRealtime();
    const [cursors, setCursors] = useState<Record<string, DomainCursor>>({});

    const onRemoteMove = useCallback((id: string, cursor: DomainCursor) => {
        setCursors((current) => ({ ...current, [id]: { ...current[id], ...cursor } }));
    }, []);

    const onRemoteClick = useCallback((id: string) => {
        setCursors((current) =>
            current[id] ? { ...current, [id]: { ...current[id], clicking: true } } : current,
        );

        setTimeout(
            () =>
                setCursors((current) =>
                    current[id]
                        ? { ...current, [id]: { ...current[id], clicking: false } }
                        : current,
                ),
            CLICK_FLASH_MS,
        );
    }, []);

    const { sendMove, sendClick } = useCursorSync(rtc, sessionId, { onRemoteMove, onRemoteClick });

    const send = useMemo(() => ({ move: sendMove, click: sendClick }), [sendMove, sendClick]);
    const pointerHandlers = useCursorEvents(surface, send);

    const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());

    useWorkspaceEvent<{ session_id: string }>(RealtimeEvents.PEER_CONNECTED, ({ session_id }) =>
        setConnectedPeers((current) => new Set([...current, session_id])),
    );

    useWorkspaceEvent<{ session_id: string }>(RealtimeEvents.PEER_DISCONNECTED, ({ session_id }) =>
        setConnectedPeers((current) => {
            const next = new Set(current);
            next.delete(session_id);
            return next;
        }),
    );

    // A peer that walked away leaves a cursor behind otherwise.
    useWorkspaceEvent<{ session_id: string }>(RealtimeEvents.PEER_DISCONNECTED, ({ session_id }) =>
        setCursors((current) => {
            const { [session_id]: _gone, ...rest } = current;
            return rest;
        }),
    );

    return { sessionId, cursors, connectedPeers, pointerHandlers };
}
