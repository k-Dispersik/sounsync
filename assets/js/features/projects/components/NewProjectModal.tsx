import { useEffect, useState, type FormEvent } from "react";

import { Button, Input, Modal } from "@/shared/ui";

interface Props {
    open: boolean;
    isSaving: boolean;
    error?: string;
    onClose: () => void;
    onCreate: (title: string) => void;
}

/**
 * Names a new project.
 *
 * A title is the only thing asked for: everything else about a project has a
 * sensible default, and a form that asks for a tempo before the first note has
 * been played is asking a question nobody can answer yet.
 */
export default function NewProjectModal({ open, isSaving, error, onClose, onCreate }: Props) {
    const [title, setTitle] = useState("");

    useEffect(() => {
        if (open) setTitle("");
    }, [open]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = title.trim();

        if (trimmed) onCreate(trimmed);
    };

    return (
        <Modal title="New project" open={open} onClose={onClose}>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <Input
                    label="Title"
                    value={title}
                    autoFocus
                    maxLength={120}
                    placeholder="Untitled project"
                    error={error}
                    onChange={(event) => setTitle(event.target.value)}
                />

                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSaving}
                        loadingLabel="Creating…"
                        disabled={title.trim() === ""}
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
