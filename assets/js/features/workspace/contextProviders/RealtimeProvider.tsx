import { createContext, useContext, useEffect, useRef, useState } from "react";
import WorkspaceChannel from "../services/signaling/workspaceChannel";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";
import { WorkspaceRtc } from "../services/transport/workspaceRtc";
import { useWorkspaceBroadcast } from "../hooks/useWorkspaceBroadcast";
import type { RealtimeEventName } from "../events/events";

interface RealtimeContextValue {
    sessionId: string;
    rtc: WorkspaceRtc | null;
    broadcast: (event: RealtimeEventName, payload: unknown) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface Props {
    workspaceId: string;
    children: React.ReactNode;
}

export default function RealtimeProvider({ workspaceId, children }: Props) {
    const sessionId = useRef(getOrCreateSessionId()).current;
    const [rtc, setRtc] = useState<WorkspaceRtc | null>(null);

    useEffect(() => {
        const channel = new WorkspaceChannel(workspaceId).join();
        const r = new WorkspaceRtc(workspaceId, channel.sessionId);
        setRtc(r);

        return () => {
            r.destroy();
            setRtc(null);
            channel.leave();
        };
    }, [workspaceId]);

    const { broadcast } = useWorkspaceBroadcast(rtc);

    return (
        <RealtimeContext.Provider value={{ sessionId, rtc, broadcast }}>
            {children}
        </RealtimeContext.Provider>
    );
}

export function useRealtime() {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error("useRealtime must be used within a RealtimeProvider");
    return ctx;
}
