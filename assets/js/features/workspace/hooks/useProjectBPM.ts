import { useEffect, useState } from "react";

interface Props {
    BPM?: number;
    onChange?: (BPM: number) => Promise<void>;
}

export function useProjectBPM({ BPM = 120, onChange }: Props) {
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
            await onChange(nextBPM);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        BPM,
        draftBPM,
        isOpen,
        isSaving,
        open,
        close,
        commit,
        setDraftBPM,
    };
}