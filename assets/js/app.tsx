import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./routers";
import { WorkspaceChannel } from "./realtime/phoenix/workspaceChannel";
import { WorkspaceRtc } from "./realtime/webrtc/workspaceRtc";
import WorkspaceCursor from "./components/cursors/cursors";

// ─── Workspace setup (test) ─────────────────────────────────────────────────────────

const workspaceId = "test-workspace";

// Phoenix channel — authoritative state events (clip:moved, transport:play, …)
const workspace = new WorkspaceChannel(workspaceId).join();

// WebRTC — ephemeral events (cursor, drag preview, …)
const rtc = new WorkspaceRtc(workspaceId, workspace.sessionId);

// Local cursor → directly to WebRTC DataChannel
let lastSent = 0;
document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastSent < 50) return;
    lastSent = now;
    rtc.send("cursor:move", { x: e.clientX, y: e.clientY, session_id: workspace.sessionId });
});

// ─── React ───────────────────────────────────────────────────────────────────

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <WorkspaceCursor />
            <AppRouter />
        </React.StrictMode>
    );
}
