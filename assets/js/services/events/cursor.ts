export const CURSOR_EVENTS = {
    MOVE: "cursor:move",
    LEAVE: "cursor:leave",
} as const;

export type CursorMovePayload = {
    x: number;
    y: number;
};

export type CursorLeavePayload = Record<string, never>;
