import { useCallback } from "react";
import type { WorkspaceRtc } from "../services/transport/workspaceRtc";
import type { RealtimeEventName } from "../events/events";

/**
 * Returns a stable `broadcast` function that sends an event over WebRTC.
 */
export function useWorkspaceBroadcast(rtc: WorkspaceRtc) {
    const broadcast = useCallback(
        (event: RealtimeEventName, payload: unknown) => {
            rtc.send(event, payload);
        },
        [rtc]
    );

    return { broadcast };
}
