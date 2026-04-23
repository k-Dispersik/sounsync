import { MousePointer2 } from "lucide-react";

interface CursorState {
    x: number;
    y: number;
    clicking?: boolean;
}

interface Props {
    cursors: Record<string, CursorState>;
}

export default function WorkspaceCursor({ cursors }: Props) {
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
