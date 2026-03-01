import { Channel } from "phoenix";
import { socket } from "./socket";

const getOrCreateSessionId = (): string => {
    const key = "session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
};

export class WorkspaceChannel {
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
        this.channel
            .join()
            .receive("ok", (resp) =>
                console.log(`[Workspace:${this.workspaceId}] joined`, resp)
            )
            .receive("error", (err) =>
                console.error(`[Workspace:${this.workspaceId}] join failed`, err)
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
