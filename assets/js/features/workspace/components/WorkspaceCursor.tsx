import { MousePointer2 } from "lucide-react";

import { cursorToPoint, type DomainCursor, type TimelineSurface } from "../model/cursor";

interface Props {
    cursors: Record<string, DomainCursor>;
    surface: TimelineSurface;
}

/**
 * Other people's pointers, drawn inside the timeline.
 *
 * Inside rather than over the page, because a cursor is at a place in the
 * music: it has to scroll with the timeline and land on the same beat on every
 * screen. A cursor on a track this client has not got is simply not drawn.
 */
export default function WorkspaceCursor({ cursors, surface }: Props) {
    return (
        <>
            {Object.entries(cursors).map(([id, cursor]) => {
                const point = cursorToPoint(cursor, surface);

                if (!point) return null;

                return (
                    <div
                        key={id}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: point.x,
                            top: point.y,
                            pointerEvents: "none",
                            zIndex: 20,
                            transition: "left 0.05s linear, top 0.05s linear",
                        }}
                    >
                        <span className="absolute bottom-5 left-1 rounded px-1 py-0.5 text-[10px] bg-primary text-primary-content">
                            {id.slice(0, 4)}
                        </span>
                        <MousePointer2
                            size={18}
                            className="text-primary"
                            style={{
                                transform: cursor.clicking ? "scale(0.75)" : "scale(1)",
                                transition: "transform 0.1s ease",
                            }}
                        />
                    </div>
                );
            })}
        </>
    );
}
