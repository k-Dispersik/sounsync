// The public face of the projects feature: the list, and what changes it.

export { useProjects, projectsQueryKey } from "./hooks/useProjects";
export type { CreateProjectDTO } from "./api/projects";
export { default as ProjectCard } from "./components/ProjectCard";
export { default as NewProjectModal } from "./components/NewProjectModal";
export { default as ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
