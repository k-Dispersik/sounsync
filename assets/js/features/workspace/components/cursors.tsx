import React, { useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

interface Props {
    cursors: Record<string, CursorState>;
    sendMove: (x: number, y: number) => void;
    sendClick: (x: number, y: number) => void;
}

export default function WorkspaceCursor({ cursors, sendMove, sendClick }: Props) {
    const lastSentRef = useRef(0);

    // ─── DOM event listeners ─────────────────────────────────
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastSentRef.current < 50) return;
            lastSentRef.current = now;
            sendMove(e.clientX, e.clientY);
        };

        const handleClick = (e: MouseEvent) => {
            sendClick(e.clientX, e.clientY);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("click", handleClick);
        };
    }, [sendMove, sendClick]);

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
