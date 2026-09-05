import { useId, type ReactElement } from "react";

/**
 * A hint shown on hover and on focus.
 *
 * On focus as well as hover, because a control reachable only by keyboard
 * would otherwise never show its hint. The text is also wired up with
 * `aria-describedby`, so it is read rather than merely displayed.
 */
export default function Tooltip({ text, children }: { text: string; children: ReactElement }) {
    const id = useId();

    return (
        <span className="relative inline-flex group">
            {children}
            <span
                id={id}
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2
                    whitespace-nowrap rounded bg-surface-raised px-2 py-1 text-xs text-default
                    opacity-0 shadow transition-opacity
                    group-hover:opacity-100 group-focus-within:opacity-100"
            >
                {text}
            </span>
        </span>
    );
}
