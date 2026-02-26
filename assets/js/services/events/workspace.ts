export const WORKSPACE_EVENTS = {
    PING: "workspace:ping",
    USER_JOINED: "workspace:user_joined",
    USER_LEFT: "workspace:user_left",
} as const;

export type WorkspacePingPayload = Record<string, never>;

export type WorkspaceUserJoinedPayload = {
    session_id: string;
};

export type WorkspaceUserLeftPayload = {
    session_id: string;
};
