import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createLogger } from "@/shared/lib/logger";
import type { Project } from "@/shared/types";
import type { RealtimeEventName } from "../events/events";
import { useWorkspaceBroadcast } from "../hooks/useWorkspaceBroadcast";
import { projectQueryKey } from "../hooks/useProject";
import { applyOperation } from "../model/applyOperation";
import { nextStatus, type ConnectionStatus } from "../model/connection";
import { toParticipants, type Participant } from "../model/presence";
import type { OperationType } from "../model/operations";
import {
    acquireWorkspaceChannel,
    getOrCreateSessionId,
    OperationRejection,
    releaseWorkspaceChannel,
    type default as WorkspaceChannelType,
} from "../services/signaling/workspaceChannel";
import { WorkspaceRtc } from "../services/transport/workspaceRtc";

const log = createLogger("Realtime");

interface RealtimeContextValue {
    sessionId: string;
    rtc: WorkspaceRtc | null;
    /** Ephemeral, best-effort: cursors, playheads, drag previews. */
    broadcast: (event: RealtimeEventName, payload: unknown) => void;
    /** Durable: an edit the server validates, records and passes on. */
    sendOperation: (type: OperationType, payload: unknown) => Promise<void>;
    participants: Participant[];
    status: ConnectionStatus;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface Props {
    projectId: number;
    workspaceId: string;
    children: React.ReactNode;
}

/**
 * Wires the two transports to the project state.
 *
 * The version the server hands back travels with every edit, so this provider
 * keeps the last one it saw. It is a ref rather than state on purpose: it
 * changes on every operation and nothing renders from it, and a stale closure
 * over it would send edits against a version that has already moved.
 */
export default function RealtimeProvider({ projectId, workspaceId, children }: Props) {
    const sessionId = useRef(getOrCreateSessionId()).current;
    const queryClient = useQueryClient();
    const [rtc, setRtc] = useState<WorkspaceRtc | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const channelRef = useRef<WorkspaceChannelType | null>(null);
    const versionRef = useRef(0);

    const replaceProject = useCallback(
        (project: Project) => {
            versionRef.current = project.version;
            queryClient.setQueryData(projectQueryKey(projectId), project);
        },
        [queryClient, projectId],
    );

    useEffect(() => {
        const channel = acquireWorkspaceChannel(workspaceId);
        channelRef.current = channel;

        channel.onOperation((event) => {
            versionRef.current = event.version;
            queryClient.setQueryData(projectQueryKey(projectId), (current: Project | undefined) =>
                current ? applyOperation(current, event) : current,
            );
        });

        channel.onPresence((state) => setParticipants(toParticipants(state)));

        // A rejoin after a dropped connection lands here too, which is what
        // makes recovery a replacement rather than a replay of missed edits.
        channel.join({
            onSnapshot: (reply) => {
                replaceProject(reply.project);
                setStatus((current) => nextStatus(current, "joined"));
            },
            onDropped: () => setStatus((current) => nextStatus(current, "dropped")),
        });

        const peerConnection = new WorkspaceRtc(workspaceId, channel.sessionId);
        setRtc(peerConnection);

        return () => {
            peerConnection.destroy();
            setRtc(null);
            releaseWorkspaceChannel(workspaceId);
            channelRef.current = null;
        };
    }, [workspaceId, projectId, queryClient, replaceProject]);

    const sendOperation = useCallback(
        async (type: OperationType, payload: unknown) => {
            const channel = channelRef.current;

            if (!channel) {
                log.warn(`dropping ${type}: not connected`);
                return;
            }

            try {
                const event = await channel.sendOperation(type, payload, versionRef.current);

                versionRef.current = event.version;
                queryClient.setQueryData(
                    projectQueryKey(projectId),
                    (current: Project | undefined) =>
                        current ? applyOperation(current, event) : current,
                );
            } catch (rejection) {
                // Being out of date is recoverable, and the server said so with
                // the current state attached: take it and carry on.
                if (
                    rejection instanceof OperationRejection &&
                    rejection.reason === "stale" &&
                    rejection.project
                ) {
                    log.warn(`${type} was built on an old version, replacing local state`);
                    replaceProject(rejection.project);
                    return;
                }

                log.error(`${type} was refused`, rejection);
                throw rejection;
            }
        },
        [queryClient, projectId, replaceProject],
    );

    const { broadcast } = useWorkspaceBroadcast(rtc);

    const value = useMemo(
        () => ({ sessionId, rtc, broadcast, sendOperation, participants, status }),
        [sessionId, rtc, broadcast, sendOperation, participants, status],
    );

    return <RealtimeContext value={value}>{children}</RealtimeContext>;
}

export function useRealtime(): RealtimeContextValue {
    const context = use(RealtimeContext);

    if (!context) throw new Error("useRealtime must be used within a RealtimeProvider");

    return context;
}
