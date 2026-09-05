import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
    primary: "bg-primary text-primary-content hover:opacity-90",
    secondary: "bg-action-secondary text-default hover:bg-hover-overlay border border-token",
    ghost: "text-muted hover:text-default hover:bg-hover-overlay",
    danger: "bg-error text-error-content hover:opacity-90",
};

const SIZES: Record<Size, string> = {
    sm: "h-7 px-2.5 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    /** Shows a busy label and blocks further clicks. */
    loading?: boolean;
    loadingLabel?: string;
    children: ReactNode;
}

/**
 * The button everything else is built from.
 *
 * `type="button"` by default on purpose: an unqualified button inside a form
 * submits it, which is a bug that only appears once a form grows a second
 * control.
 */
export default function Button({
    variant = "secondary",
    size = "md",
    loading = false,
    loadingLabel = "Working…",
    disabled,
    className = "",
    children,
    type = "button",
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled ?? loading}
            aria-busy={loading || undefined}
            className={`inline-flex items-center justify-center rounded-md font-medium transition-colors
                focus-ring disabled:opacity-40 disabled:cursor-not-allowed
                ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            {...rest}
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
