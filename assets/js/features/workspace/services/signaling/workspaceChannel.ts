import { Channel } from "phoenix";

import { createLogger } from "@/shared/lib/logger";
import type { Project } from "@/shared/types";
import { operationEventSchema, type OperationEvent } from "../../model/operations";
import { connectSocket, socket } from "./socket";

const log = createLogger("WorkspaceChannel");

export const getOrCreateSessionId = (): string => {
    const key = "session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
};

export interface JoinReply {
    workspace_id: string;
    session_id: string;
    project: Project;
}

/**
 * The server refused the edit.
 *
 * An `Error` rather than a bare object so it travels through promise chains
 * and logging like any other failure; `project` is present when the reason was
 * that we were out of date, and carries the state to adopt.
 */
export class OperationRejection extends Error {
    readonly reason: string;
    readonly project?: Project;
    readonly details?: Record<string, string[]>;

    constructor(body: { reason: string; project?: Project; details?: Record<string, string[]> }) {
        super(`operation refused: ${body.reason}`);
        this.name = "OperationRejection";
        this.reason = body.reason;
        this.project = body.project;
        this.details = body.details;
    }
}

/**
 * The workspace channel: the reliable half of realtime.
 *
 * Everything that changes the project goes through here and comes back with a
 * version, so a client always knows whether what it holds is current. Cursors
 * and playheads do not: they go over WebRTC, where losing one costs a frame.
 */
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

    /**
     * Joins and resolves with the snapshot. Rejoins after a dropped connection
     * resolve too, which is what makes reconnection a state replacement rather
     * than a replay.
     */
    join(onSnapshot?: (reply: JoinReply) => void): this {
        connectSocket();
        log.debug(`${this.workspaceId}: joining, socket state ${socket.connectionState()}`);

        this.channel
            .join()
            .receive("ok", (reply: JoinReply) => {
                log.debug(`${this.workspaceId}: joined at version ${reply.project.version}`);
                onSnapshot?.(reply);
            })
            .receive("error", (error) => log.error(`${this.workspaceId}: join failed`, error))
            .receive("timeout", () => log.warn(`${this.workspaceId}: join timed out`));

        return this;
    }

    /** Sends an edit and resolves with what the server made of it. */
    sendOperation(type: string, payload: unknown, baseVersion: number): Promise<OperationEvent> {
        return new Promise((resolve, reject) => {
            this.channel
                .push("op", {
                    type,
                    payload,
                    base_version: baseVersion,
                    client_id: this.sessionId,
                })
                .receive("ok", (reply) => resolve(operationEventSchema.parse(reply)))
                .receive("error", (body: ConstructorParameters<typeof OperationRejection>[0]) =>
                    reject(new OperationRejection(body)),
                )
                .receive("timeout", () => reject(new OperationRejection({ reason: "timeout" })));
        });
    }

    onOperation(handler: (event: OperationEvent) => void): number {
        return this.channel.on("op", (payload) => {
            const parsed = operationEventSchema.safeParse(payload);

            if (parsed.success) handler(parsed.data);
            else log.error("received an operation of an unexpected shape", parsed.error.issues);
        });
    }

    onPresence(handler: (state: unknown) => void): number {
        return this.channel.on("presence_state", handler);
    }

    onPresenceDiff(handler: (diff: unknown) => void): number {
        return this.channel.on("presence_diff", handler);
    }

    leave() {
        this.channel.leave();
    }
}
