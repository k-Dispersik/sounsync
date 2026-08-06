import { useCallback } from "react";
import { useParams } from "react-router-dom";
import WorkspaceCursor from "../../features/workspace/components/WorkspaceCursor";
import TimelineGrid from "../../features/workspace/components/TimelineGrid";
import WorkspaceTopBar from "../../features/workspace/components/WorkspaceTopBar";
import SampleSidebar from "../../features/workspace/components/SampleSidebar";
import { updateProjectSettings } from "../../features/workspace/api/projects";
import { useWorkspaceRealtime } from "../../features/workspace/hooks/useWorkspaceRealtime";
import { useWorkspaceEvent } from "../../features/workspace/hooks/useWorkspaceEvent";
import { RealtimeEvents } from "../../features/workspace/events/events";
import { useProject } from "../../features/workspace/hooks/useProject";
import type { Clip, ProjectSettings, Track } from "../../shared/types";
import TransportProvider from "js/features/workspace/contextProviders/TransportProvider";
import ClipModalProvider from "js/features/workspace/contextProviders/ClipModalProvider";
import RealtimeProvider, {
    useRealtime,
} from "js/features/workspace/contextProviders/RealtimeProvider";
import { getOrCreateSessionId } from "js/features/workspace/services/signaling/workspaceChannel";

// The realtime room is named after the project, which is what the server
// authorises against; a shared constant put every project in one room.
const workspaceTopic = (projectId: string | undefined) => `project:${projectId ?? ""}`;

function WorkspaceContent() {
    const { id } = useParams<{ id: string }>();
    const { cursors } = useWorkspaceRealtime(workspaceTopic(id));
    const {
        project,
        isLoading,
        isError,
        refetch,
        addClip,
        updateClipInState,
        updateSettings,
        addTrack,
        removeTrack,
    } = useProject(Number(id));

    // Remote peer created a clip — add it directly without API call
    useWorkspaceEvent<{ session_id: string; track_id: number; clip: Clip }>(
        RealtimeEvents.CLIP_CREATED,
        ({ track_id, clip }) => addClip(track_id, clip),
    );

    const handleClipSuccess = useCallback(
        (trackId: number, clip: Clip, isEdit: boolean) => {
            if (isEdit) {
                updateClipInState(trackId, clip.id, clip);
            } else {
                addClip(trackId, clip);
            }
        },
        [addClip, updateClipInState],
    );

    const handleProjectSettingsChange = useCallback(
        async (settings: ProjectSettings) => {
            if (!id) return;
            await updateProjectSettings(Number(id), settings);
            updateSettings(settings);
        },
        [id, updateSettings],
    );

    const handleTrackAdded = useCallback(
        (track: Track) => {
            addTrack(track);
        },
        [addTrack],
    );

    const handleTrackRemoved = useCallback(
        (trackId: number) => {
            removeTrack(trackId);
        },
        [removeTrack],
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
            <ClipModalProvider onSuccess={handleClipSuccess}>
                <WorkspaceCursor cursors={cursors} />
                <WorkspaceTopBar
                    isLoading={isLoading}
                    projectTitle={project?.title}
                    projectSettings={project?.settings}
                    onChangeProjectSettings={handleProjectSettingsChange}
                />

                {/* ── Main body ── */}
                <div className="flex flex-1 overflow-hidden">
                    <SampleSidebar
                        projectId={Number(id)}
                        tracks={project?.tracks || []}
                        isLoading={isLoading}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <TimelineGrid
                                project={project}
                                isLoading={isLoading}
                                onTrackAdded={handleTrackAdded}
                                onTrackRemoved={handleTrackRemoved}
                            />
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
            <RealtimeProvider workspaceId={workspaceTopic(id)}>
                <WorkspaceContent />
            </RealtimeProvider>
        </div>
    );
}
