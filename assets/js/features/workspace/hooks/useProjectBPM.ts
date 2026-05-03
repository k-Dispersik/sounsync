import type { ProjectSettings } from "js/shared/types/project";
import { useEffect, useState } from "react";

interface Props {
    settings: ProjectSettings;
    onChange?: (settings: ProjectSettings) => Promise<void>;
}

export function useProjectBPM({ settings, onChange }: Props) {
    const { BPM } = settings;
    const [isOpen, setIsOpen] = useState(false);
    const [draftBPM, setDraftBPM] = useState(String(BPM));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setDraftBPM(String(BPM));
        }
    }, [BPM, isOpen]);

    const open = () => setIsOpen(true);

    const close = () => {
        setDraftBPM(String(BPM));
        setIsOpen(false);
    };

    const commit = async () => {
        const parsedBPM = Number(draftBPM);
        const nextBPM = Number.isFinite(parsedBPM) ? Math.min(300, Math.max(20, parsedBPM)) : BPM;

        setDraftBPM(String(nextBPM));
        setIsOpen(false);

        if (!onChange || nextBPM === BPM) {
            return;
        }

        setIsSaving(true);

        try {
            await onChange({ ...settings, BPM: nextBPM });
        } finally {
            setIsSaving(false);
        }
    };

    const keyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            void commit();
        }

        if (event.key === "Escape") {
            close();
        }
    }

    return {
        BPM,
        draftBPM,
        isOpen,
        isSaving,
        open,
        close,
        commit,
        setDraftBPM,
        keyDown
    };
}