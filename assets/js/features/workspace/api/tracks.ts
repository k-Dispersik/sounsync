import apiClient from "../../../shared/api/client";

export interface Clip {
    id: number;
    title: string;
    type: string;
    start_time: number;
    duration: number;
    settings?: unknown;
    file_path: string;
}

export interface Track {
    id: number;
    project_id: number;
    row_index: number;
    clips: Clip[];
}

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