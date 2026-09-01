import { useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import {
    ClipModalProvider,
    ConnectionBanner,
    OPERATIONS,
    RealtimeProvider,
    SampleSidebar,
    TimelineGrid,
    TransportProvider,
    useProject,
    useRealtime,
    WorkspaceTopBar,
} from "@/features/workspace";

import { createLogger } from "@/shared/lib/logger";
import { debounce } from "@/shared/lib/rate";
import type { ProjectSettings } from "@/shared/types";

const log = createLogger("Workspace");

// Dragging a tempo through 90 values should ask the server once, when the
// person stops, not ninety times on the way.
const SETTINGS_DEBOUNCE_MS = 400;

// The realtime room is named after the project, which is what the server
// authorises against; a shared constant put every project in one room.
const workspaceTopic = (projectId: string | undefined) => `project:${projectId ?? ""}`;

function WorkspaceContent() {
    const { id } = useParams<{ id: string }>();
    const { project, isLoading, isError, refetch } = useProject(Number(id));
    const { sendOperation, status } = useRealtime();

    // Edits no longer update local state directly: they go to the server and
    // come back as operations that update the project for everyone, including
    // the person who made them.
    const pushSettings = useMemo(
        () =>
            debounce((settings: ProjectSettings) => {
                sendOperation(OPERATIONS.SETTINGS_UPDATE, settings).catch((error: unknown) =>
                    log.error("could not change the project settings", error),
                );
            }, SETTINGS_DEBOUNCE_MS),
        [sendOperation],
    );

    useEffect(
        () => () => {
            pushSettings.cancel();
        },
        [pushSettings],
    );

    const handleProjectSettingsChange = useCallback(
        (settings: ProjectSettings) => {
            pushSettings(settings);
            return Promise.resolve();
        },
        [pushSettings],
    );

    if (isError) {
        return (
            <div
                role="alert"
                className="flex-1 flex flex-col items-center justify-center gap-3 text-sm"
            >
                <p className="text-base-content/60">This project could not be loaded.</p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="h-8 px-4 rounded-md bg-primary text-primary-content text-sm"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <TransportProvider>
            <ClipModalProvider>
                <ConnectionBanner status={status} />
                <WorkspaceTopBar
                    isLoading={isLoading}
                    projectTitle={project?.title}
                    projectSettings={project?.settings}
                    onChangeProjectSettings={handleProjectSettingsChange}
                />

                <div className="flex flex-1 overflow-hidden">
                    <SampleSidebar projectId={Number(id)} />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <TimelineGrid project={project} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </ClipModalProvider>
        </TransportProvider>
    );
}

export default function Workspace() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="w-full h-screen bg-base-200 flex flex-col overflow-hidden">
            <RealtimeProvider projectId={Number(id)} workspaceId={workspaceTopic(id)}>
                <WorkspaceContent />
            </RealtimeProvider>
        </div>
    );
}
