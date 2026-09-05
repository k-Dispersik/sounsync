import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Required: an icon with no name is invisible to anyone not looking at it. */
    label: string;
    icon: ReactNode;
    active?: boolean;
    size?: "sm" | "md";
}

const SIZES = { sm: "w-7 h-7", md: "w-9 h-9" };

/**
 * A button whose whole content is an icon.
 *
 * Separate from `Button` so the label cannot be forgotten: it is a required
 * prop here, and becomes both the accessible name and the tooltip.
 */
export default function IconButton({
    label,
    icon,
    active = false,
    size = "md",
    className = "",
    type = "button",
    ...rest
}: IconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            aria-pressed={active || undefined}
            title={label}
            className={`inline-flex items-center justify-center rounded-md transition-colors focus-ring
                disabled:opacity-40 disabled:cursor-not-allowed
                ${active ? "bg-primary text-primary-content" : "text-muted hover:text-default hover:bg-hover-overlay"}
                ${SIZES[size]} ${className}`}
            {...rest}
        >
            {icon}
        </button>
    );
}
