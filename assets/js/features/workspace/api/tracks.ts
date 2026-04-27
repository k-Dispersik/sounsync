import apiClient from "../../../shared/api/client";
import type { Track } from "../../../shared/types/index";

export interface CreateTrackDTO {
    row: number;
}

export async function createTrack(projectId: number, dto: CreateTrackDTO): Promise<Track> {
    const { data } = await apiClient.post<Track>(`/projects/${projectId}/tracks`, dto);
    return data;
}

export async function deleteTrack(projectId: number, trackId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/tracks/${trackId}`);
}