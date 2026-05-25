export const RealtimeEvents = {
    CURSOR_MOVE: "workspace:cursor:move",
    CURSOR_CLICK: "workspace:cursor:click",
    PEER_CONNECTED: "workspace:peer:connected",
    PEER_DISCONNECTED: "workspace:peer:disconnected",
    CLIP_MOVED: "workspace:clip:moved",
} as const;

export type RealtimeEventName = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

// Typed event union — all bus communication must use these shapes
export type WorkspaceEvent =
    | { type: "cursor_move"; payload: { session_id: string; x: number; y: number } }
    | { type: "cursor_click"; payload: { session_id: string; x: number; y: number } }
    | { type: "peer_connected"; payload: { session_id: string } }
    | { type: "peer_disconnected"; payload: { session_id: string } }
    | { type: "clip_moved"; payload: { session_id: string; clip_id: number; track_id: number; start_time: number } };
