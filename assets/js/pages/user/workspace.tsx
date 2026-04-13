import WorkspaceCursor from "../../features/workspace/components/cursors";
import TrackClip from "../../features/workspace/components/TrackClip";
import { useWorkspaceRealtime } from "../../features/workspace/hooks/useWorkspaceRealtime";

const WORKSPACE_ID = "test-workspace";

export default function Workspace() {
    const { cursors, sendCursor, sendCursorClick } = useWorkspaceRealtime(WORKSPACE_ID);

    return (<>
        <WorkspaceCursor
            cursors={cursors}
            sendMove={sendCursor}
            sendClick={sendCursorClick}
        />
        <div
            className="absolute top-2 h-20"
            style={{ left: '0%', width: '50%' }}
        >
            <TrackClip name="Kick Pattern" color="#f01e1e" />
        </div>
    </>);
}