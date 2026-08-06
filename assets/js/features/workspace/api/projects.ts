import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { projectSchema, projectSummarySchema } from "@/shared/api/schemas";
import type { Project, ProjectSettings, ProjectSummary } from "@/shared/types";
import { z } from "zod";

export interface CreateProjectDTO {
    title: string;
    description?: string;
}

export async function getProjects(): Promise<ProjectSummary[]> {
    const { data } = await apiClient.get<unknown>("/projects");
    return parseResponse(z.array(projectSummarySchema), "GET /projects", data);
}

export async function getProject(id: number): Promise<Project> {
    const { data } = await apiClient.get<unknown>(`/projects/${id}`);
    return parseResponse(projectSchema, `GET /projects/${id}`, data);
}

export async function createProject(dto: CreateProjectDTO): Promise<Project> {
    const { data } = await apiClient.post<unknown>("/projects", dto);
    return parseResponse(projectSchema, "POST /projects", data);
}

export async function updateProjectSettings(
    id: number,
    settings: ProjectSettings,
): Promise<Project> {
    const { data } = await apiClient.patch<unknown>(`/projects/${id}/settings`, { settings });
    return parseResponse(projectSchema, `PATCH /projects/${id}/settings`, data);
}
