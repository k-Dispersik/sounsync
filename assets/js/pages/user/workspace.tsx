import { WorkspaceChannel } from "../../realtime/phoenix/workspaceChannel";
import { WorkspaceRtc } from "../../realtime/transport/workspaceRtc";
import WorkspaceCursor from "../../components/cursors/cursors";
import TrackClip from "../../components/tracks/TrackClip";

const WORKSPACE_ID = "test-workspace";

const workspace = new WorkspaceChannel(WORKSPACE_ID).join();
const rtc = new WorkspaceRtc(WORKSPACE_ID, workspace.sessionId);

export default function Workspace() {
    return (<>
        <WorkspaceCursor rtc={rtc} sessionId={workspace.sessionId} />
        <div
            className="absolute top-2 h-20"
            style={{ left: '0%', width: '50%' }}
        >
            <TrackClip name="Kick Pattern" color="#f01e1e" />
        </div>
    </>);
}