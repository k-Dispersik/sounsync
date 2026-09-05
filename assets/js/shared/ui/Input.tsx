import { useId, type InputHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
    label: string;
    /** Shown under the field, and announced with it. */
    hint?: string;
    error?: string;
    /** Hides the label visually while keeping it for assistive technology. */
    labelHidden?: boolean;
}

/**
 * A labelled text field.
 *
 * The label, hint and error are wired to the input by id rather than left
 * beside it: a field whose error is only a red sentence nearby is a field
 * whose error nobody using a screen reader ever hears.
 */
function describe(id: string, hint?: string, error?: string) {
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const parts = [hint ? hintId : null, error ? errorId : null].filter(Boolean);

    return { hintId, errorId, describedBy: parts.join(" ") || undefined };
}

export default function Input({
    label,
    hint,
    error,
    labelHidden = false,
    className = "",
    ...rest
}: InputProps) {
    const id = useId();
    const { hintId, errorId, describedBy } = describe(id, hint, error);

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className={labelHidden ? "sr-only" : "text-xs text-muted"}>
                {label}
            </label>

            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={`field w-full focus-ring ${className}`}
                {...rest}
            />

            {hint && !error && (
                <p id={hintId} className="text-xs text-subtle">
                    {hint}
                </p>
            )}

            {error && (
                <p id={errorId} role="alert" className="text-xs text-error">
                    {error}
                </p>
            )}
        </div>
    );
}
