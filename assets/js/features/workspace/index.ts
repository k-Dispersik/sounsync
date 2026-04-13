// Public API for the workspace feature
export { default as WorkspaceCursor } from "./components/cursors";
export { default as TrackClip } from "./components/TrackClip";
export type { TrackClipProps } from "./components/TrackClip";

export { useWorkspaceRealtime } from "./hooks/useWorkspaceRealtime";
export { useCursorSync } from "./hooks/useCursorSync";
export type { CursorCallbacks } from "./hooks/useCursorSync";

export { RealtimeEvents } from "./events/events";
export type { RealtimeEventName, WorkspaceEvent } from "./events/events";

export { workspaceBus } from "./services/workspaceBus";
export { WorkspaceChannel } from "./services/signaling/workspaceChannel";
export { WorkspaceRtc } from "./services/transport/workspaceRtc";
