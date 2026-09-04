import { useRef, useState } from "react";

import type { Project, Track } from "@/shared/types";
import { beatDurationMs, parseTimeSignature } from "../services/audio/clock";
import { pixelsPerMillisecond as pixelsPerMs, type TimelineScale } from "../model/timeline";

interface Props {
    project: Project | null;
    beatWidth: number;
}

function getMinimumTimelineLengthMs(tracks: Track[]) {
    return tracks.reduce((projectMax, track) => {
        const trackMax = track.clips.reduce((clipMax, clip) => {
            return Math.max(clipMax, clip.start_time + clip.duration);
        }, 0);

        return Math.max(projectMax, trackMax);
    }, 0);
}

export function useTimeline({ project, beatWidth }: Props) {
    const tracks = project?.tracks ?? [];
    const BPM = project?.settings?.bpm || 120;
    const timeSignature = project?.settings?.time_signature || "4/4";
    const timelineLengthMs = project?.settings?.timeline_length_ms || 60_000;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredBeat, setHoveredBeat] = useState<number | null>(null);
    const [hoveredTrackId, setHoveredTrackId] = useState<number | null>(null);

    const { beatsPerBar } = parseTimeSignature(timeSignature);
    const scale: TimelineScale = { bpm: BPM, timeSignature, pixelsPerBeat: beatWidth };
    const millisecondsPerBeat = beatDurationMs(BPM, timeSignature);
    const pixelsPerMillisecond = pixelsPerMs(scale);
    const minimumTimelineLengthMs = getMinimumTimelineLengthMs(tracks);
    const resolvedTimelineLengthMs = Math.max(timelineLengthMs, minimumTimelineLengthMs);
    const totalBeats = Math.max(1, Math.ceil(resolvedTimelineLengthMs / millisecondsPerBeat));
    const gridBeatWidth = millisecondsPerBeat * pixelsPerMillisecond;
    const contentWidth = resolvedTimelineLengthMs * pixelsPerMillisecond;
    const fullBarsInView = Math.floor(contentWidth / (beatsPerBar * gridBeatWidth));
    const barEndLines = Array.from(
        { length: fullBarsInView },
        (_, barIndex) => (barIndex + 1) * beatsPerBar * gridBeatWidth,
    );

    const handleTrackBeatHover = (beatIndex: number, trackId: number) => {
        setHoveredBeat(beatIndex);
        setHoveredTrackId(trackId);
    };

    const handleRulerBeatHover = (beatIndex: number) => {
        setHoveredBeat(beatIndex);
        setHoveredTrackId(null);
    };

    const handleBeatLeave = () => {
        setHoveredBeat(null);
        setHoveredTrackId(null);
    };

    return {
        scale,
        scrollRef,
        hoveredBeat,
        hoveredTrackId,
        beatsPerBar,
        totalBeats,
        contentWidth,
        gridBeatWidth,
        barEndLines,
        pixelsPerMillisecond,
        handleTrackBeatHover,
        handleRulerBeatHover,
        handleBeatLeave,
    };
}
