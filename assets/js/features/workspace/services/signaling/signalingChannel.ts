import { Channel } from "phoenix";
import { connectSocket, socket } from "./socket";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("Signaling");

export class SignalingChannel {
    private channel: Channel;

    constructor(workspaceId: string) {
        this.channel = socket.channel(`signaling:${workspaceId}`);
    }

    join(): this {
        connectSocket();

        this.channel
            .join()
            .receive("ok", () => log.debug("joined"))
            .receive("error", (err) => log.error("join failed", err));
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
