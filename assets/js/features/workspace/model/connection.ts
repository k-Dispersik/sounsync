/**
 * How the workspace's connection is doing, from the user's point of view.
 *
 * `resynced` is deliberately a state of its own rather than a flag: coming
 * back from a dropped connection replaces the local project wholesale, which
 * can make edits that were in flight disappear. Saying so out loud is more
 * honest than letting the timeline silently change under someone's hands.
 */
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "resynced";

export type ConnectionEvent = "joined" | "dropped";

export function nextStatus(current: ConnectionStatus, event: ConnectionEvent): ConnectionStatus {
    if (event === "dropped") return current === "connecting" ? "connecting" : "reconnecting";

    // A join that follows a drop is a resync; the first one is just a start.
    return current === "reconnecting" ? "resynced" : "connected";
}
