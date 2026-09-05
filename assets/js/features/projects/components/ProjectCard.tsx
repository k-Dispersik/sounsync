import { Music2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { ProjectSummary } from "@/shared/types";
import { IconButton } from "@/shared/ui";

interface Props {
    project: ProjectSummary;
    href: string;
    onDelete: () => void;
    isDeleting?: boolean;
}

/**
 * One project in the list.
 *
 * The whole card is the link, and delete is a button inside it, so opening a
 * project — by far the commoner act — needs no aim, while removing one still
 * takes a deliberate click on a small target.
 */
export default function ProjectCard({ project, href, onDelete, isDeleting = false }: Props) {
    return (
        <li className="group relative">
            <Link
                to={href}
                className="flex items-center gap-3 rounded-lg border border-token bg-surface p-4
                    transition-colors hover:border-token-strong focus-ring"
            >
                <span
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md
                        bg-hover-overlay text-muted"
                >
                    <Music2 size={16} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-default">
                        {project.title}
                    </span>
                    <span className="block truncate text-xs text-subtle">
                        {project.description || `${project.settings.bpm} BPM`}
                    </span>
                </span>
            </Link>

            <span className="absolute inset-y-0 right-3 flex items-center">
                <IconButton
                    size="sm"
                    label={`Delete ${project.title}`}
                    icon={<Trash2 size={15} />}
                    disabled={isDeleting}
                    onClick={onDelete}
                />
            </span>
        </li>
    );
}
