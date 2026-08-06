import type { ProjectSettings } from "@/shared/types";
import { useEffect, useState } from "react";

interface Props {
    settings: ProjectSettings;
    onChange?: (settings: ProjectSettings) => Promise<void>;
}

export function useProjectBPM({ settings, onChange }: Props) {
    const { bpm } = settings;
    const [isOpen, setIsOpen] = useState(false);
    const [draftBPM, setDraftBPM] = useState(String(bpm));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setDraftBPM(String(bpm));
        }
    }, [bpm, isOpen]);

    const open = () => setIsOpen(true);

    const close = () => {
        setDraftBPM(String(bpm));
        setIsOpen(false);
    };

    const commit = async () => {
        const parsedBPM = Number(draftBPM);
        const nextBPM = Number.isFinite(parsedBPM) ? Math.min(300, Math.max(20, parsedBPM)) : bpm;

        setDraftBPM(String(nextBPM));
        setIsOpen(false);

        if (!onChange || nextBPM === bpm) {
            return;
        }

        setIsSaving(true);

        try {
            await onChange({ ...settings, bpm: nextBPM });
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
    };

    return {
        bpm,
        draftBPM,
        isOpen,
        isSaving,
        open,
        close,
        commit,
        setDraftBPM,
        keyDown,
    };
}
