import { useEffect, useRef, type ReactNode } from "react";

import IconButton from "./IconButton";

export interface ModalProps {
    title: string;
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

/**
 * A dialog built on the native `<dialog>` element.
 *
 * Native gives the focus trap, the Escape key and the inert background for
 * free — all three of which hand-rolled modals routinely get wrong. What is
 * left to do here is to keep React's idea of "open" and the element's own in
 * step, and to close when the backdrop is clicked.
 */
export default function Modal({ title, open, onClose, children, footer }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;

        if (!dialog) return;

        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = ref.current;

        if (!dialog) return;

        // Escape closes the element directly, so React has to be told.
        const handleClose = () => onClose();
        dialog.addEventListener("close", handleClose);

        return () => dialog.removeEventListener("close", handleClose);
    }, [onClose]);

    return (
        <dialog
            ref={ref}
            aria-labelledby="modal-title"
            className="m-auto w-full max-w-md rounded-xl bg-surface-raised text-default
                backdrop:bg-neutral/60 p-0"
            onClick={(event) => {
                // A click that lands on the dialog itself is a backdrop click:
                // the content sits in a child element.
                if (event.target === ref.current) onClose();
            }}
        >
            <div className="flex items-center justify-between border-b border-token px-5 py-4">
                <h2 id="modal-title" className="text-base font-semibold">
                    {title}
                </h2>
                <IconButton
                    label="Close"
                    size="sm"
                    icon={<span aria-hidden="true">×</span>}
                    onClick={onClose}
                />
            </div>

            <div className="px-5 py-4">{children}</div>

            {footer && (
                <div className="flex items-center justify-end gap-2 border-t border-token px-5 py-4">
                    {footer}
                </div>
            )}
        </dialog>
    );
}
