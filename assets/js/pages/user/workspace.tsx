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

const WORKSPACE_ID = "test-workspace";

export default function Workspace() {
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
        <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
            <TransportProvider>
                <WorkspaceCursor cursors={cursors} />
                <WorkspaceTopBar
                    isLoading={isLoading}
                    projectTitle={project?.title}
                    projectSettings={project?.settings}
                    onChangeProjectSettings={handleProjectSettingsChange}
                />

                {/* ── Main body ── */}
                <div className="flex flex-1 overflow-hidden">
                    <SampleSidebar tracks={project?.tracks || []} isLoading={isLoading} />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <TimelineGrid
                                projectId={Number(id)}
                                isLoading={isLoading}
                                tracks={project?.tracks || []}
                                timeSignature={project?.settings?.timeSignature}
                                BPM={project?.settings?.BPM}
                                timelineLengthMs={project?.settings?.timelineLengthMs}
                                onTrackChanged={refetch}
                            />
                        </div>
                    </div>
                </div>
            </TransportProvider>
        </div>
    );
}