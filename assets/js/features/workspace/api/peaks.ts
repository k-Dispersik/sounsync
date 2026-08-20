import { z } from "zod";

import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";

const peaksSchema = z.object({
    /** Base64 of one byte per column, 0..127. Null until the file is analysed. */
    peaks: z.string().nullable(),
    peaks_per_second: z.number(),
    duration_ms: z.number().nullable(),
});

export interface Waveform {
    /** One value per column, 0..1. */
    columns: number[];
    peaksPerSecond: number;
}

export async function getWaveform(projectId: number, audioFileId: number): Promise<Waveform> {
    const path = `/projects/${projectId}/audio_files/${audioFileId}/peaks`;
    const { data } = await apiClient.get<unknown>(path);
    const body = parseResponse(peaksSchema, `GET ${path}`, data);

    return {
        columns: body.peaks ? decode(body.peaks) : [],
        peaksPerSecond: body.peaks_per_second,
    };
}

function decode(base64: string): number[] {
    const binary = atob(base64);
    const columns = new Array<number>(binary.length);

    for (let index = 0; index < binary.length; index++) {
        // The server sends 0..127; the UI works in 0..1.
        columns[index] = binary.charCodeAt(index) / 127;
    }

    return columns;
}
