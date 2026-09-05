import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Project, ProjectSummary } from "@/shared/types";
import { createProject, deleteProject, getProjects, type CreateProjectDTO } from "../api/projects";

export const projectsQueryKey = ["projects"] as const;

/**
 * The caller's projects, with the two things that change the list.
 *
 * Both mutations write into the cached list themselves rather than only
 * invalidating it: a new project should appear as soon as the server has
 * accepted it, without a second round trip to find out what we just sent.
 */
export function useProjects() {
    const queryClient = useQueryClient();

    const query = useQuery({ queryKey: projectsQueryKey, queryFn: getProjects });

    const create = useMutation({
        mutationFn: (dto: CreateProjectDTO) => createProject(dto),
        onSuccess: (project: Project) => {
            queryClient.setQueryData<ProjectSummary[]>(projectsQueryKey, (previous) => [
                ...(previous ?? []),
                summaryOf(project),
            ]);
        },
    });

    const remove = useMutation({
        mutationFn: (id: number) => deleteProject(id),
        onSuccess: (_result, id) => {
            queryClient.setQueryData<ProjectSummary[]>(projectsQueryKey, (previous) =>
                (previous ?? []).filter((project) => project.id !== id),
            );
        },
    });

    return {
        projects: query.data ?? [],
        isLoading: query.isPending,
        isError: query.isError,
        refetch: query.refetch,
        createProject: create.mutateAsync,
        isCreating: create.isPending,
        createError: create.error,
        removeProject: remove.mutate,
        removingId: remove.isPending ? remove.variables : null,
    };
}

/** A created project arrives with its tracks; the list holds summaries. */
function summaryOf(project: Project): ProjectSummary {
    const { id, title, description, version, settings } = project;

    return { id, title, description, version, settings };
}
