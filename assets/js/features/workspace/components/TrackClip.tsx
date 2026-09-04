import { useEffect, useMemo, useState } from "react";
import { GripVertical, Pencil } from "lucide-react";
import { Clip } from "@/shared/types";
import { useClipInteraction } from "../hooks/useClipInteraction";
import { useClipModal } from "../contextProviders/ClipModalProvider";
import { useWorkspaceEvent } from "../hooks/useWorkspaceEvent";
import { RealtimeEvents } from "../events/events";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";
import { useWaveform } from "../hooks/useWaveform";
import type { TimelineScale } from "../model/timeline";

export interface TrackClipProps {
    /** Base accent colour (hex, rgb, etc.) used for header, bars and border */
    color: string;
    /**
     * Number of waveform bars to render.
     * @default 50
     */
    clip: Clip;
    projectId: number;
    trackId: number;
    pixelsPerMillisecond: number;
    scale: TimelineScale;
    barCount?: number;
    /** Extra class names applied to the root element */
    className?: string;
    /** Called when the user clicks the clip */
    onClick?: () => void;
}

// Drawn while the real waveform is loading, or when the clip has no audio
// behind it yet. Deterministic on purpose: a shape that changes on every
// render reads as the clip itself changing.
function placeholderBars(seed: string, count: number): number[] {
    let hash = 0;
    for (let index = 0; index < seed.length; index++) {
        hash = Math.imul(31, hash) + seed.charCodeAt(index);
    }

    return Array.from({ length: count }, () => {
        hash = Math.imul(1664525, hash) + 1013904223;
        return 0.2 + ((hash >>> 0) / 0xffffffff) * 0.25;
    });
}

export default function TrackClip({
    color,
    projectId,
    trackId,
    barCount = 50,
    pixelsPerMillisecond,
    scale,
    className = "",
    onClick,
    clip,
}: TrackClipProps) {
    const { bars } = useWaveform(projectId, clip.audio_file_id ?? null, barCount);

    const barHeights = useMemo(
        () => (bars ?? placeholderBars(color, barCount)).map((value) => 10 + value * 90),
        [bars, color, barCount],
    );

    const { isDragging, tempStartTime, committedStartTime, startDrag } = useClipInteraction({
        clip,
        trackId,
        pixelsPerMillisecond,
        scale,
    });
    const { openEditClip } = useClipModal();

    const [remoteStartTime, setRemoteStartTime] = useState<number | null>(null);
    const sessionId = getOrCreateSessionId();

    useWorkspaceEvent<{
        session_id: string;
        clip_id: number;
        track_id: number;
        start_time: number;
    }>(RealtimeEvents.CLIP_MOVED, ({ session_id, clip_id, start_time }) => {
        if (clip_id === clip.id && session_id !== sessionId) {
            setRemoteStartTime(start_time);
        }
    });

    useEffect(() => {
        setRemoteStartTime(null);
    }, [clip.start_time]);

    const displayStartTime = isDragging ? tempStartTime : (remoteStartTime ?? committedStartTime);

    return (
        <div
            key={clip.id}
            className="absolute top-2 bottom-2 z-20"
            style={{
                left: displayStartTime * pixelsPerMillisecond,
                width: Math.max(2, clip.duration * pixelsPerMillisecond - 2),
            }}
        >
            <div
                className={`relative h-full overflow-hidden cursor-pointer group/clip transition-all hover:scale-[1.01] ${className}`}
                style={{
                    backgroundColor: `${color}20`,
                    border: `1px solid ${color}40`,
                }}
                onClick={onClick}
            >
                {/* ── Header ── */}
                <div
                    className="h-6 px-2 flex items-center gap-2"
                    style={{ backgroundColor: `${color}30` }}
                >
                    <GripVertical
                        className={`w-3 h-3 text-base-content/50 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                        onMouseDown={startDrag}
                    />
                    <button
                        className="ml-auto w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover/clip:opacity-100 hover:text-primary transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditClip(projectId, trackId, clip);
                        }}
                    >
                        <Pencil size={10} />
                    </button>
                </div>

                {/* ── Waveform bars ── */}
                <div
                    className="px-1 flex items-end gap-px"
                    style={{ height: "calc(100% - 1.5rem)" }}
                >
                    {barHeights.map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-t"
                            style={{
                                height: `${h}%`,
                                backgroundColor: color,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
