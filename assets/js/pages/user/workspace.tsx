import { useParams } from "react-router-dom";
import WorkspaceCursor from "../../features/workspace/components/WorkspaceCursor";
import TimelineGrid from "../../features/workspace/components/TimelineGrid";
import WorkspaceTopBar from "../../features/workspace/components/WorkspaceTopBar";
import SampleSidebar from "../../features/workspace/components/SampleSidebar";
import { useWorkspaceRealtime } from "../../features/workspace/hooks/useWorkspaceRealtime";
import { useProject } from "../../features/workspace/hooks/useProject";

const WORKSPACE_ID = "test-workspace";

export default function Workspace() {
    const { id } = useParams<{ id: string }>();
    const { cursors } = useWorkspaceRealtime(WORKSPACE_ID);
    const { project, isLoading, refetch } = useProject(Number(id));

    return (
        <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
            <WorkspaceCursor cursors={cursors} />

            {/* ── Top bar ── */}
            <WorkspaceTopBar isLoading={isLoading} projectTitle={project?.title} />

            {/* ── Main body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sample browser */}
                <SampleSidebar tracks={project?.tracks || []} isLoading={isLoading} />

                {/* Timeline area */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <TimelineGrid projectId={Number(id)} isLoading={isLoading} tracks={project?.tracks || []} onTrackChanged={refetch} />
                    </div>
                </div>
            </div>
        </div>
    );
}