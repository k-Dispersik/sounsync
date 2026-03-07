import { useEffect, useRef } from "react";
import { workspaceBus } from "../bus/workspaceBus";
import type { RealtimeEventName } from "../events";

/**
 * Subscribe to a workspace realtime event.
 *
 * The latest `handler` is always called without re-subscribing to the bus
 * on every render — only the event name change triggers a new subscription.
 */
export function useWorkspaceEvent<T = unknown>(
    event: RealtimeEventName,
    handler: (payload: T) => void
): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const stableHandler = (payload: T) => handlerRef.current(payload);
        return workspaceBus.on<T>(event, stableHandler);
    }, [event]);
}
