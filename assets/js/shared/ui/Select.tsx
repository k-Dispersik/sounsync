import { useId, type SelectHTMLAttributes } from "react";

export interface SelectOption<T extends string> {
    value: T;
    label: string;
}

export interface SelectProps<T extends string> extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "onChange" | "value"
> {
    label: string;
    value: T;
    options: readonly SelectOption<T>[];
    onChange: (value: T) => void;
    labelHidden?: boolean;
}

/**
 * A native select.
 *
 * Native because a custom dropdown has to reimplement keyboard navigation,
 * typeahead and the mobile picker, and usually reimplements the first two
 * badly. When the design needs something the native control cannot do, that is
 * the moment to replace this — not before.
 */
export default function Select<T extends string>({
    label,
    value,
    options,
    onChange,
    labelHidden = false,
    className = "",
    ...rest
}: SelectProps<T>) {
    const id = useId();

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className={labelHidden ? "sr-only" : "text-xs text-muted"}>
                {label}
            </label>

            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value as T)}
                className={`field w-full focus-ring ${className}`}
                {...rest}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
