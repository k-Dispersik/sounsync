import { useMemo } from 'react'
import { GripVertical } from 'lucide-react'

export interface TrackClipProps {
    /** Label shown inside the clip header */
    name: string
    /** Base accent colour (hex, rgb, etc.) used for header, bars and border */
    color: string
    /**
     * Number of waveform bars to render.
     * @default 50
     */
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
    name,
    color,
    barCount = 50,
    className = '',
    onClick,
}: TrackClipProps) {
    const barHeights = useMemo(() => {
        const rand = seededRng(name)
        return Array.from({ length: barCount }, () => 20 + rand() * 80)
    }, [name, barCount])

    return (
        <div
            className={`relative h-full rounded-lg overflow-hidden cursor-pointer group/clip transition-all hover:scale-[1.02] ${className}`}
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
                <GripVertical className="w-3 h-3 text-white/50 cursor-grab" />
                <span className="text-xs text-white truncate">{name}</span>
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

            {/* ── Resize handles (visible on hover) ── */}
            <div className="absolute left-0 top-0 w-2 h-full cursor-w-resize opacity-0 group-hover/clip:opacity-100 bg-white/20 transition-opacity" />
            <div className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover/clip:opacity-100 bg-white/20 transition-opacity" />
        </div>
    )
}
