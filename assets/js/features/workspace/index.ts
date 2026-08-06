// Public API for the workspace feature
export { default as WorkspaceCursor } from "./components/WorkspaceCursor";
export { default as TrackClip } from "./components/TrackClip";
export type { TrackClipProps } from "./components/TrackClip";
export { default as TimelineGrid } from "./components/TimelineGrid";
export type { Project, Track, Clip } from "@/shared/types";
export { default as WorkspaceTopBar } from "./components/WorkspaceTopBar";
export { default as WorkspaceToolbar } from "./components/WorkspaceToolbar";
export { default as SampleSidebar } from "./components/SampleSidebar";

export { useWorkspaceRealtime } from "./hooks/useWorkspaceRealtime";
export { useCursorSync } from "./hooks/useCursorSync";
export type { CursorCallbacks } from "./hooks/useCursorSync";
export { useCursorEvents } from "./hooks/useCursorEvents";

export { RealtimeEvents } from "./events/events";
export type { RealtimeEventName, WorkspaceEvent } from "./events/events";

export { workspaceBus } from "./services/workspaceBus";
export { default as WorkspaceChannel } from "./services/signaling/workspaceChannel";
export { WorkspaceRtc } from "./services/transport/workspaceRtc";
