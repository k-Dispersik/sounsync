// The public face of the workspace feature. Anything outside it imports from
// here, so what the rest of the app depends on stays a short, deliberate list.

export { default as ConnectionBanner } from "./components/ConnectionBanner";
export { default as SampleSidebar } from "./components/SampleSidebar";
export { default as TimelineGrid } from "./components/TimelineGrid";
export { default as TrackClip } from "./components/TrackClip";
export type { TrackClipProps } from "./components/TrackClip";
export { default as WorkspaceCursor } from "./components/WorkspaceCursor";
export { default as WorkspaceToolbar } from "./components/WorkspaceToolbar";
export { default as WorkspaceTopBar } from "./components/WorkspaceTopBar";

export { default as ClipModalProvider } from "./contextProviders/ClipModalProvider";
export { default as RealtimeProvider, useRealtime } from "./contextProviders/RealtimeProvider";
export { default as TransportProvider } from "./contextProviders/TransportProvider";

export { useProject } from "./hooks/useProject";
export { useCursorEvents } from "./hooks/useCursorEvents";
export { useCursorSync } from "./hooks/useCursorSync";
export type { CursorCallbacks } from "./hooks/useCursorSync";
export { useWorkspaceEvent } from "./hooks/useWorkspaceEvent";
export { useWorkspaceRealtime } from "./hooks/useWorkspaceRealtime";

export { OPERATIONS } from "./model/operations";
export type { OperationEvent, OperationType } from "./model/operations";
export type { ConnectionStatus } from "./model/connection";

export { RealtimeEvents } from "./events/events";
export type { RealtimeEventName, WorkspaceEvent } from "./events/events";

export { workspaceBus } from "./services/workspaceBus";
export { default as WorkspaceChannel } from "./services/signaling/workspaceChannel";
export { WorkspaceRtc } from "./services/transport/workspaceRtc";
