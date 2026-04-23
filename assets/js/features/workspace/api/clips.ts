import apiClient from "../../../shared/api/client";

export interface Clip {
    id: number;
    title: string;
    type: string;
    start_time: number;
    duration: number;
    track_id: number;
    file_path: string;
}

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
    dto: CreateClipDTO
): Promise<Clip> {
    const { data } = await apiClient.post<Clip>(
        `/projects/${projectId}/tracks/${trackId}/clips`,
        dto
    );
    return data;
}
