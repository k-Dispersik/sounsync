import { useEffect, useRef, useState } from "react";
import type { Track } from "js/shared/types";

interface SelectedPosition {
    beatIndex: number;
    trackId: number | null;
    rowIndex: number | null;
}

interface Props {
    tracks: Track[];
    BPM?: number;
    beatWidth: number;
    timelineLengthMs?: number;
    timeSignature?: string;
}

function getBeatsPerBar(timeSignature?: string) {
    const parsedBeatsPerBar = Number.parseInt(timeSignature?.split("/")[0] ?? "4", 10);

    return Number.isFinite(parsedBeatsPerBar) ? parsedBeatsPerBar : 4;
}

function getMinimumTimelineLengthMs(tracks: Track[]) {
    return tracks.reduce((projectMax, track) => {
        const trackMax = track.clips.reduce((clipMax, clip) => {
            return Math.max(clipMax, clip.start_time + clip.duration);
        }, 0);

        return Math.max(projectMax, trackMax);
    }, 0);
}

export function useTimelineGrid({ tracks, BPM = 120, beatWidth, timelineLengthMs = 60_000, timeSignature }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredBeat, setHoveredBeat] = useState<number | null>(null);
    const [hoveredTrackId, setHoveredTrackId] = useState<number | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);

    const beatsPerBar = getBeatsPerBar(timeSignature);
    const millisecondsPerBeat = 60_000 / BPM;
    const pixelsPerMillisecond = beatWidth / millisecondsPerBeat;
    const minimumTimelineLengthMs = getMinimumTimelineLengthMs(tracks);
    const resolvedTimelineLengthMs = Math.max(timelineLengthMs, minimumTimelineLengthMs);
    const totalBeats = Math.max(1, Math.ceil(resolvedTimelineLengthMs / millisecondsPerBeat));
    const totalBars = Math.max(1, Math.ceil(totalBeats / beatsPerBar));
    const contentWidth = totalBeats * beatWidth;
    const selectedCell = selectedPosition && selectedPosition.trackId !== null
        ? { trackId: selectedPosition.trackId, beatIndex: selectedPosition.beatIndex }
        : null;

    const handleRulerBeatClick = (beatIndex: number) => {
        setSelectedPosition({ beatIndex, trackId: null, rowIndex: null });
    };

    const handleTrackBeatClick = (beatIndex: number, trackId: number, rowIndex: number) => {
        setSelectedPosition({ beatIndex, trackId, rowIndex });
    };

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

    const handleOpenCreateClipModal = (_trackId: number, _beatIndex: number) => {
        // TODO: open modal and pass trackId and second
    };

    return {
        scrollRef,
        hoveredBeat,
        hoveredTrackId,
        selectedPosition,
        selectedCell,
        beatsPerBar,
        totalBars,
        totalBeats,
        contentWidth,
        pixelsPerMillisecond,
        resolvedTimelineLengthMs,
        millisecondsPerBeat,
        handleRulerBeatClick,
        handleTrackBeatClick,
        handleTrackBeatHover,
        handleRulerBeatHover,
        handleBeatLeave,
        handleOpenCreateClipModal,
    };
}