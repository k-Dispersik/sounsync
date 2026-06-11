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

const WORKSPACE_ID = "test-workspace";

function WorkspaceContent() {
    const { id } = useParams<{ id: string }>();
    const { cursors } = useWorkspaceRealtime(WORKSPACE_ID);
    const {
        project,
        isLoading,
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
    return (
        <div className="w-full h-screen bg-base-200 flex flex-col overflow-hidden">
            <RealtimeProvider workspaceId={WORKSPACE_ID}>
                <WorkspaceContent />
            </RealtimeProvider>
        </div>
    );
}
