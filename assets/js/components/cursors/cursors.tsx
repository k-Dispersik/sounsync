import React, { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { workspaceBus } from "../../realtime/workspaceBus";

interface CursorPosition {
    x: number;
    y: number;
}

export default function WorkspaceCursor() {
    const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});

    useEffect(() => {
        const unsubscribe = workspaceBus.on<{ session_id: string; x: number; y: number }>(
            "cursor:move",
            ({ session_id, x, y }) => {
                setCursors((prev) => ({ ...prev, [session_id]: { x, y } }));
            }
        );

        return unsubscribe;
    }, []);

    return (
        <>
            {Object.entries(cursors).map(([sessionId, { x, y }]) => (
                <div
                    key={sessionId}
                    style={{
                        position: "fixed",
                        left: x,
                        top: y,
                        pointerEvents: "none",
                        zIndex: 9999,
                        transition: "left 0.05s linear, top 0.05s linear",
                    }}
                >
                    <MousePointer2 size={18} />
                </div>
            ))}
        </>
    );
}
