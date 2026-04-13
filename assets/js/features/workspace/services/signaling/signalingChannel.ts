import { Channel } from "phoenix";
import { socket } from "./socket";

export class SignalingChannel {
    private channel: Channel;

    constructor(workspaceId: string) {
        this.channel = socket.channel(`signaling:${workspaceId}`);
    }

    join(): this {
        this.channel
            .join()
            .receive("ok", () => console.log("[Signaling] joined"))
            .receive("error", (err) => console.error("[Signaling] join failed", err));
        return this;
    }

    leave(): void {
        this.channel.leave();
    }

    push(payload: object): void {
        this.channel.push("signal", payload);
    }

    on(callback: (payload: unknown) => void): number {
        return this.channel.on("signal", callback);
    }

    off(ref: number): void {
        this.channel.off("signal", ref);
    }
}
