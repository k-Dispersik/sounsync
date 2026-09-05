import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmDeleteModal, NewProjectModal, ProjectCard, useProjects } from "@/features/projects";
import { USER_ROUTES } from "@/routers/routes.names";
import { Logo } from "@/shared/components/Logo";
import UserSettings from "@/shared/components/UserSettings";
import { createLogger } from "@/shared/lib/logger";
import type { ProjectSummary } from "@/shared/types";
import { Button, EmptyState, ErrorState, Skeleton } from "@/shared/ui";

const log = createLogger("Projects");

const projectPath = (id: number) => USER_ROUTES.PROJECT.replace(":id", String(id));

export default function ProjectsPage() {
    const {
        projects,
        isLoading,
        isError,
        refetch,
        createProject,
        isCreating,
        createError,
        removeProject,
        removingId,
    } = useProjects();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);
    const navigate = useNavigate();

    // Straight into the new project: making one and then having to find it in
    // the list is a step nobody wants.
    const handleCreate = (title: string) => {
        createProject({ title })
            .then((project) => {
                setCreateOpen(false);
                void navigate(projectPath(project.id));
            })
            .catch((error: unknown) => log.error("could not create the project", error));
    };

    return (
        <div className="flex min-h-screen flex-col bg-surface-sunken">
            <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-token bg-surface px-4">
                <Logo size={16} />
                <div className="ml-auto">
                    <UserSettings />
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-default">Projects</h1>
                    <Button variant="primary" onClick={() => setCreateOpen(true)}>
                        <Plus size={15} />
                        New project
                    </Button>
                </div>

                <ProjectList
                    projects={projects}
                    isLoading={isLoading}
                    isError={isError}
                    removingId={removingId}
                    onRetry={() => void refetch()}
                    onCreate={() => setCreateOpen(true)}
                    onDelete={setPendingDelete}
                />
            </main>

            <NewProjectModal
                open={isCreateOpen}
                isSaving={isCreating}
                error={createError ? "The project could not be created." : undefined}
                onClose={() => setCreateOpen(false)}
                onCreate={handleCreate}
            />

            <ConfirmDeleteModal
                project={pendingDelete}
                isDeleting={removingId !== null}
                onCancel={() => setPendingDelete(null)}
                onConfirm={(id) => {
                    removeProject(id);
                    setPendingDelete(null);
                }}
            />
        </div>
    );
}

function ProjectList({
    projects,
    isLoading,
    isError,
    removingId,
    onRetry,
    onCreate,
    onDelete,
}: {
    projects: ProjectSummary[];
    isLoading: boolean;
    isError: boolean;
    removingId: number | null;
    onRetry: () => void;
    onCreate: () => void;
    onDelete: (project: ProjectSummary) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-[69px] w-full rounded-lg" count={3} />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorState
                title="Your projects could not be loaded."
                description="The server did not answer. Nothing has been lost."
                onRetry={onRetry}
            />
        );
    }

    if (projects.length === 0) {
        return (
            <EmptyState
                title="No projects yet"
                description="A project is one piece of music: its tracks, its clips and everyone working on it."
                action={
                    <Button variant="primary" onClick={onCreate}>
                        <Plus size={15} />
                        New project
                    </Button>
                }
            />
        );
    }

    return (
        <ul className="flex flex-col gap-3">
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    href={projectPath(project.id)}
                    isDeleting={removingId === project.id}
                    onDelete={() => onDelete(project)}
                />
            ))}
        </ul>
    );
}
