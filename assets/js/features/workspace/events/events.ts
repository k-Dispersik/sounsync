export const RealtimeEvents = {
    CURSOR_MOVE: "workspace:cursor:move",
    CURSOR_CLICK: "workspace:cursor:click",

    // Event names for future features:
    // COMPONENT_MOVE: "workspace:component:move",
    // COMPONENT_RESIZE: "workspace:component:resize",
    // COMPONENT_CREATE: "workspace:component:create",
    // COMPONENT_DELETE: "workspace:component:delete",
} as const;

export type RealtimeEventName = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

// Typed event union — all bus communication must use these shapes
export type WorkspaceEvent =
    | { type: "cursor_move"; payload: { session_id: string; x: number; y: number } }
    | { type: "cursor_click"; payload: { session_id: string; x: number; y: number } };
