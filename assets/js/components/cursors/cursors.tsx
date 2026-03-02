import React, { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { WorkspaceRtc } from "../../realtime/webrtc/workspaceRtc";
import { workspaceBus } from "../../realtime/workspaceBus";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

interface Props {
    rtc: WorkspaceRtc;
    sessionId: string;
}

export default function WorkspaceCursor({ rtc, sessionId }: Props) {
    const [cursors, setCursors] = useState<Record<string, CursorState>>({});
    const lastSentRef = useRef(0);

    // ─── Outgoing ───────────────────────────────────────────
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastSentRef.current < 50) return;
            lastSentRef.current = now;
            rtc.send("cursor:move", { x: e.clientX, y: e.clientY, session_id: sessionId });
        };

        const handleClick = (e: MouseEvent) => {
            rtc.send("cursor:click", { x: e.clientX, y: e.clientY, session_id: sessionId });
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("click", handleClick);
        };
    }, [rtc, sessionId]);

    // ─── Incoming ───────────────────────────────────────────
    useEffect(() => {
        return workspaceBus.on<{ session_id: string; x: number; y: number }>(
            "cursor:move",
            ({ session_id, x, y }) => {
                if (session_id === sessionId) return;
                setCursors((prev) => ({ ...prev, [session_id]: { ...prev[session_id], x, y } }));
            }
        );
    }, [sessionId]);

    useEffect(() => {
        return workspaceBus.on<{ session_id: string }>(
            "cursor:click",
            ({ session_id }) => {
                if (session_id === sessionId) return;
                setCursors((prev) => ({ ...prev, [session_id]: { ...prev[session_id], clicking: true } }));
                setTimeout(() => {
                    setCursors((prev) => ({ ...prev, [session_id]: { ...prev[session_id], clicking: false } }));
                }, 200);
            }
        );
    }, [sessionId]);

    return (
        <>
            {Object.entries(cursors).map(([id, { x, y, clicking }]) => (
                <div
                    key={id}
                    style={{
                        position: "fixed",
                        left: x,
                        top: y,
                        pointerEvents: "none",
                        zIndex: 9999,
                        transition: "left 0.05s linear, top 0.05s linear",
                    }}
                >
                    <span className="absolute badge badge-primary !p-1 bottom-6 left-1">
                        {id.slice(0, 4)}
                    </span>
                    <MousePointer2
                        size={18}
                        style={{
                            transform: clicking ? "scale(0.75)" : "scale(1)",
                            transition: "transform 0.1s ease",
                        }}
                    />
                </div>
            ))}
        </>
    );
}
