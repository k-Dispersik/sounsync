import { Channel } from "phoenix";
import { socket } from "./socket";

export const getOrCreateSessionId = (): string => {
    const key = "session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
};

// Provides a high-level API for joining a Phoenix channel scoped to a workspace,
// with an associated session ID for identifying the client.
export default class WorkspaceChannel {
    readonly workspaceId: string;
    readonly sessionId: string;
    private channel: Channel;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.sessionId = getOrCreateSessionId();
        this.channel = socket.channel(`workspace:${workspaceId}`, {
            session_id: this.sessionId,
        });
    }

    join() {
        console.log(`[Workspace:${this.workspaceId}] calling join(), socket state: ${socket.connectionState()}`);
        this.channel
            .join()
            .receive("ok", (resp) =>
                console.log(`[Workspace:${this.workspaceId}] joined`, resp)
            )
            .receive("error", (err) =>
                console.error(`[Workspace:${this.workspaceId}] join failed`, err)
            )
            .receive("timeout", () =>
                console.warn(`[Workspace:${this.workspaceId}] join timed out`)
            );
        return this;
    }

    leave() {
        this.channel.leave();
    }

    push(event: string, payload: object = {}) {
        return this.channel.push(event, payload);
    }

    on(event: string, callback: (payload: unknown) => void) {
        return this.channel.on(event, callback);
    }

    off(event: string, ref: number) {
        this.channel.off(event, ref);
    }
}
