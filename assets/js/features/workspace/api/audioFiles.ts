import { z } from "zod";

import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { audioFileSchema } from "@/shared/api/schemas";
import type { AudioFile } from "@/shared/types";

export async function listAudioFiles(projectId: number): Promise<AudioFile[]> {
    const path = `/projects/${projectId}/audio_files`;
    const { data } = await apiClient.get<unknown>(path);

    return parseResponse(z.array(audioFileSchema), `GET ${path}`, data);
}
