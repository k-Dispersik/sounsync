import { useCallback } from "react";
import { useParams } from "react-router-dom";
import WorkspaceCursor from "../../features/workspace/components/WorkspaceCursor";
import TimelineGrid from "../../features/workspace/components/TimelineGrid";
import WorkspaceTopBar from "../../features/workspace/components/WorkspaceTopBar";
import SampleSidebar from "../../features/workspace/components/SampleSidebar";
import { updateProjectSettings } from "../../features/workspace/api/projects";
import { useWorkspaceRealtime } from "../../features/workspace/hooks/useWorkspaceRealtime";
import { useProject } from "../../features/workspace/hooks/useProject";
import type { ProjectSettings } from "../../shared/types";
import TransportProvider from "js/features/workspace/contextProviders/TransportProvider";
import ClipModalProvider from "js/features/workspace/contextProviders/ClipModalProvider";
import RealtimeProvider from "js/features/workspace/contextProviders/RealtimeProvider";

const WORKSPACE_ID = "test-workspace";

function WorkspaceContent() {
    const { id } = useParams<{ id: string }>();
    const { cursors } = useWorkspaceRealtime(WORKSPACE_ID);
    const { project, isLoading, refetch } = useProject(Number(id));

    const handleProjectSettingsChange = useCallback(async (settings: ProjectSettings) => {
        if (!id) {
            return;
        }

        await updateProjectSettings(Number(id), settings);
        refetch();
    }, [id, refetch]);

    return (
        <TransportProvider>
            <ClipModalProvider onSuccess={refetch}>
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
                                onTrackChanged={refetch}
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