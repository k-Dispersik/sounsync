import apiClient from "js/shared/api/client";
import { parseResponse } from "js/shared/api/parse";
import { trackSchema } from "js/shared/api/schemas";
import type { Track } from "js/shared/types";

export interface CreateTrackDTO {
    row: number;
}

export async function createTrack(projectId: number, dto: CreateTrackDTO): Promise<Track> {
    const { data } = await apiClient.post<unknown>(`/projects/${projectId}/tracks`, dto);
    return parseResponse(trackSchema, `POST /projects/${projectId}/tracks`, data);
}

export async function deleteTrack(projectId: number, trackId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/tracks/${trackId}`);
}
