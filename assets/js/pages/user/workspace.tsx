import WorkspaceCursor from "../../features/workspace/components/WorkspaceCursor";
import TimelineGrid from "../../features/workspace/components/TimelineGrid";
import WorkspaceTopBar from "../../features/workspace/components/WorkspaceTopBar";
import WorkspaceToolbar from "../../features/workspace/components/WorkspaceToolbar";
import SampleSidebar from "../../features/workspace/components/SampleSidebar";
import type { Track } from "../../features/workspace/components/TimelineGrid";
import { useWorkspaceRealtime } from "../../features/workspace/hooks/useWorkspaceRealtime";

const WORKSPACE_ID = "test-workspace";

// Mock
const DEMO_TRACKS: Track[] = [
    {
        id: "1",
        name: "Kick",
        clips: [
            { id: "c1", name: "Kick Pattern", color: "#22c55e", startBeat: 0, lengthBeats: 8 },
            { id: "c2", name: "Kick Fill", color: "#22c55e", startBeat: 12, lengthBeats: 8 },
        ],
    },
    {
        id: "2",
        name: "Snare",
        clips: [
            { id: "c3", name: "Snare Hit", color: "#ec4899", startBeat: 4, lengthBeats: 5 },
            { id: "c4", name: "Snare Fill", color: "#ec4899", startBeat: 10, lengthBeats: 5 },
        ],
    },
    {
        id: "3",
        name: "Hi-Hat",
        clips: [
            { id: "c5", name: "Hi-Hat Loop", color: "#06b6d4", startBeat: 0, lengthBeats: 32 },
        ],
    },
    {
        id: "4",
        name: "Bass",
        clips: [
            { id: "c6", name: "Bass Line", color: "#a855f7", startBeat: 6, lengthBeats: 16 },
        ],
    },
    {
        id: "5",
        name: "Synth",
        clips: [
            { id: "c7", name: "Synth Arp", color: "#06b6d4", startBeat: 0, lengthBeats: 32 },
        ],
    },
];

export default function Workspace() {
    const { cursors } = useWorkspaceRealtime(WORKSPACE_ID);

    return (
        <div className="w-full h-screen bg-[#0d1117] flex flex-col overflow-hidden">
            <WorkspaceCursor cursors={cursors} />

            {/* ── Top bar ── */}
            <WorkspaceTopBar />

            {/* ── Main body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sample browser */}
                <SampleSidebar />

                {/* Timeline area */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    <WorkspaceToolbar />
                    <div className="flex-1 overflow-hidden">
                        <TimelineGrid tracks={DEMO_TRACKS} />
                    </div>
                </div>
            </div>
        </div>
    );
}