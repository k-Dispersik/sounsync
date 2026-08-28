import { Channel, Presence } from "phoenix";

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
    private leaveRequested = false;
    private snapshot: JoinReply | null = null;
    private joinedOnce = false;
    private handlers: {
        onSnapshot?: (reply: JoinReply) => void;
        onDropped?: () => void;
    } = {};

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
    join(
        handlers: {
            onSnapshot?: (reply: JoinReply) => void;
            onDropped?: () => void;
        } = {},
    ): this {
        // A Phoenix channel may be joined once. When the same room is picked
        // up again — a remount, or a second consumer — hand over what we
        // already have instead of joining twice.
        if (this.joinedOnce) {
            this.handlers = handlers;
            if (this.snapshot) handlers.onSnapshot?.(this.snapshot);
            return this;
        }

        this.joinedOnce = true;
        this.handlers = handlers;
        connectSocket();
        log.debug(`${this.workspaceId}: joining, socket state ${socket.connectionState()}`);

        // Phoenix resends the join push after a dropped connection, and these
        // hooks run again with it — which is what makes a reconnect deliver a
        // fresh snapshot rather than a gap nobody notices.
        this.channel
            .join()
            .receive("ok", (reply: JoinReply) => {
                log.debug(`${this.workspaceId}: joined at version ${reply.project.version}`);

                // Someone asked to leave while the join was still in flight;
                // honour it now, or this session lingers in presence forever.
                if (this.leaveRequested) {
                    this.channel.leave();
                    return;
                }

                this.snapshot = reply;
                this.handlers.onSnapshot?.(reply);
            })
            .receive("error", (error) => log.error(`${this.workspaceId}: join failed`, error))
            .receive("timeout", () => log.warn(`${this.workspaceId}: join timed out`));

        this.channel.onError(() => this.handlers.onDropped?.());
        this.channel.onClose(() => this.handlers.onDropped?.());

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

    /**
     * Keeps a presence list in step with the room.
     *
     * `presence_state` arrives once on join and `presence_diff` on every change
     * after it; letting Phoenix's own `Presence` fold them together is what
     * keeps a participant from lingering after their last tab closes.
     */
    onPresence(handler: (state: unknown) => void): void {
        const presence = new Presence(this.channel);

        // `list` gives one entry per session key with its metas, which is the
        // shape the presence model parses.
        presence.onSync(() =>
            handler(
                Object.fromEntries(
                    presence.list((key, entry: { metas: unknown[] }) => [key, entry]),
                ),
            ),
        );
    }

    /**
     * Leaves the room.
     *
     * The Phoenix client ignores `leave()` on a channel that is still joining,
     * which is easy to hit: navigating away, or a development double-mount,
     * both leave before the join has landed. The intent is remembered instead
     * and acted on when the join replies.
     */
    leave() {
        this.leaveRequested = true;

        if (this.channel.state === "joined") this.channel.leave();
    }

    /** The last snapshot the server sent, for a consumer that arrives late. */
    get lastSnapshot(): JoinReply | null {
        return this.snapshot;
    }
}

// A socket allows one channel per topic, so the mapping from topic to channel
// belongs to the connection rather than to whichever component happens to want
// it. Reference counting keeps a remount — React runs effects twice in
// development — from leaving a second channel joined behind the first.
const rooms = new Map<
    string,
    { channel: WorkspaceChannel; refs: number; timer?: ReturnType<typeof setTimeout> }
>();

// Long enough to span a remount, short enough that a real navigation leaves
// promptly.
const LEAVE_GRACE_MS = 250;

export function acquireWorkspaceChannel(workspaceId: string): WorkspaceChannel {
    const existing = rooms.get(workspaceId);

    if (existing) {
        clearTimeout(existing.timer);
        existing.timer = undefined;
        existing.refs += 1;
        return existing.channel;
    }

    const channel = new WorkspaceChannel(workspaceId);
    rooms.set(workspaceId, { channel, refs: 1 });

    return channel;
}

export function releaseWorkspaceChannel(workspaceId: string): void {
    const room = rooms.get(workspaceId);

    if (!room) return;

    room.refs -= 1;

    if (room.refs > 0) return;

    room.timer = setTimeout(() => {
        if (rooms.get(workspaceId)?.refs === 0) {
            room.channel.leave();
            rooms.delete(workspaceId);
        }
    }, LEAVE_GRACE_MS);
}
