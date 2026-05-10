import { useMemo } from 'react'
import { GripVertical, Pencil } from 'lucide-react'
import { Clip } from 'js/shared/types'
import { useClipInteraction } from '../hooks/useClipInteraction'
import { useClipModal } from '../contextProviders/ClipModalProvider'

export interface TrackClipProps {
    /** Base accent colour (hex, rgb, etc.) used for header, bars and border */
    color: string
    /**
     * Number of waveform bars to render.
     * @default 50
     */
    clip: Clip
    projectId: number
    trackId: number
    pixelsPerMillisecond: number
    barCount?: number
    /** Extra class names applied to the root element */
    className?: string
    /** Called when the user clicks the clip */
    onClick?: () => void

}


/** helpers*/
function seededRng(seed: string) {
    let h = 0
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i)
    }
    return () => {
        h = Math.imul(1664525, h) + 1013904223
        return ((h >>> 0) / 0xffffffff)
    }
}


export default function TrackClip({
    color,
    projectId,
    trackId,
    barCount = 50,
    pixelsPerMillisecond,
    className = '',
    onClick,
    clip,
}: TrackClipProps) {
    const barHeights = useMemo(() => {
        const rand = seededRng(color)
        return Array.from({ length: barCount }, () => 20 + rand() * 80)
    }, [color, barCount])

    const { isDragging, tempStartTime, startDrag } =
        useClipInteraction({ clip, projectId, trackId, pixelsPerMillisecond });
    const { openEditClip } = useClipModal();

    return (
        <div
            key={clip.id}
            className="absolute top-2 bottom-2 z-20"
            style={{
                left: tempStartTime * pixelsPerMillisecond,
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
                        onClick={(e) => { e.stopPropagation(); openEditClip(projectId, trackId, clip); }}
                    >
                        <Pencil size={10} />
                    </button>
                </div>

                {/* ── Waveform bars ── */}
                <div className="px-1 flex items-end gap-px" style={{ height: 'calc(100% - 1.5rem)' }}>
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
    )
}
