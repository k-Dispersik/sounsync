import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { projectSchema } from "@/shared/api/schemas";
import type { Project, ProjectSettings } from "@/shared/types";

export async function getProject(id: number): Promise<Project> {
    const { data } = await apiClient.get<unknown>(`/projects/${id}`);
    return parseResponse(projectSchema, `GET /projects/${id}`, data);
}

export async function updateProjectSettings(
    id: number,
    settings: ProjectSettings,
): Promise<Project> {
    const { data } = await apiClient.patch<unknown>(`/projects/${id}/settings`, { settings });
    return parseResponse(projectSchema, `PATCH /projects/${id}/settings`, data);
}
