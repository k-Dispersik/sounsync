import type { ProjectSummary } from "@/shared/types";
import { Button, Modal } from "@/shared/ui";

interface Props {
    project: ProjectSummary | null;
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: (id: number) => void;
}

/**
 * Asks before removing a project.
 *
 * Deleting takes the tracks, the clips and everyone else's work with it, and
 * nothing brings it back — which is exactly the kind of action that should not
 * happen on a mis-click next to a link.
 */
export default function ConfirmDeleteModal({ project, isDeleting, onCancel, onConfirm }: Props) {
    return (
        <Modal title="Delete project?" open={project !== null} onClose={onCancel}>
            <p className="text-sm text-muted">
                {project ? `"${project.title}"` : "This project"} and everything in it — tracks,
                clips and uploads — will be removed for everyone. This cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    loading={isDeleting}
                    loadingLabel="Deleting…"
                    onClick={() => project && onConfirm(project.id)}
                >
                    Delete
                </Button>
            </div>
        </Modal>
    );
}
