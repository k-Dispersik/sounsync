import apiClient from "js/shared/api/client";
import { parseResponse } from "js/shared/api/parse";
import { clipSchema } from "js/shared/api/schemas";
import type { Clip } from "js/shared/types";

export interface CreateClipDTO {
    title: string;
    type: string;
    start_time: number;
    duration: number;
    row_index: number;
}

export async function createClip(
    projectId: number,
    trackId: number,
    dto: CreateClipDTO,
): Promise<Clip> {
    const path = `/projects/${projectId}/tracks/${trackId}/clips`;
    const { data } = await apiClient.post<unknown>(path, dto);
    return parseResponse(clipSchema, `POST ${path}`, data);
}

export async function updateClip(
    projectId: number,
    trackId: number,
    clipId: number,
    dto: Partial<CreateClipDTO>,
): Promise<Clip> {
    const path = `/projects/${projectId}/tracks/${trackId}/clips/${clipId}`;
    const { data } = await apiClient.patch<unknown>(path, dto);
    return parseResponse(clipSchema, `PATCH ${path}`, data);
}
