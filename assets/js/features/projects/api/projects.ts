import { z } from "zod";

import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { projectSchema, projectSummarySchema } from "@/shared/api/schemas";
import type { Project, ProjectSummary } from "@/shared/types";

export interface CreateProjectDTO {
    title: string;
    description?: string;
}

export async function getProjects(): Promise<ProjectSummary[]> {
    const { data } = await apiClient.get<unknown>("/projects");

    return parseResponse(z.array(projectSummarySchema), "GET /projects", data);
}

export async function createProject(dto: CreateProjectDTO): Promise<Project> {
    const { data } = await apiClient.post<unknown>("/projects", dto);

    return parseResponse(projectSchema, "POST /projects", data);
}

/** Deleting answers 204 with no body, so there is nothing to parse. */
export async function deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
}
