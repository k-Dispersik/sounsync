import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getWaveform } from "../api/peaks";

export const waveformQueryKey = (projectId: number, audioFileId: number) =>
    ["waveform", projectId, audioFileId] as const;

/**
 * The waveform of a clip's audio, reduced to the number of bars being drawn.
 *
 * A file has hundreds of columns per second and a clip on screen has a few
 * dozen bars, so the columns are pooled rather than sampled: taking every Nth
 * value would make a kick drum disappear whenever it fell between samples.
 *
 * Waveforms never change once analysed, so they are cached indefinitely.
 */
export function useWaveform(projectId: number, audioFileId: number | null, barCount: number) {
    const query = useQuery({
        queryKey: waveformQueryKey(projectId, audioFileId ?? 0),
        queryFn: () => getWaveform(projectId, audioFileId as number),
        enabled: Boolean(audioFileId) && projectId > 0,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const bars = useMemo(() => {
        const columns = query.data?.columns ?? [];

        if (columns.length === 0) return null;

        return Array.from({ length: barCount }, (_unused, index) => {
            const from = Math.floor((index * columns.length) / barCount);
            const to = Math.max(from + 1, Math.floor(((index + 1) * columns.length) / barCount));

            let loudest = 0;
            for (let position = from; position < to && position < columns.length; position++) {
                loudest = Math.max(loudest, columns[position] ?? 0);
            }

            return loudest;
        });
    }, [query.data, barCount]);

    return { bars, isLoading: query.isPending && Boolean(audioFileId) };
}
