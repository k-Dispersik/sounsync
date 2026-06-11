import { useState } from "react";

interface SelectedPosition {
    beatIndex: number;
    trackId: number | null;
    rowIndex: number | null;
}

export function useTimelineSelection() {
    const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);

    const selectedCell =
        selectedPosition && selectedPosition.trackId !== null
            ? { trackId: selectedPosition.trackId, beatIndex: selectedPosition.beatIndex }
            : null;

    const handleRulerBeatClick = (beatIndex: number) => {
        setSelectedPosition({ beatIndex, trackId: null, rowIndex: null });
    };

    const handleTrackBeatClick = (beatIndex: number, trackId: number, rowIndex: number) => {
        setSelectedPosition({ beatIndex, trackId, rowIndex });
    };

    return {
        selectedPosition,
        selectedCell,
        handleRulerBeatClick,
        handleTrackBeatClick,
    };
}
