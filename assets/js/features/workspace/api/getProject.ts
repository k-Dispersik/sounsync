import apiClient from "../../../shared/api/client";

export interface Project {
    id: number;
    title: string;
    description: string | null;
}

export async function getProject(id: number): Promise<Project> {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
}
