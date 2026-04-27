import apiClient from "../../../shared/api/client";
import type { Project } from "../../../shared/types/index";

export interface CreateProjectDTO {
    title: string;
    description?: string;
}

export async function getProjects(): Promise<Project[]> {
    const { data } = await apiClient.get<Project[]>("/projects");
    return data;
}

export async function getProject(id: number): Promise<Project> {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
}

export async function createProject(dto: CreateProjectDTO): Promise<Project> {
    const { data } = await apiClient.post<Project>("/projects", dto);
    return data;
}
