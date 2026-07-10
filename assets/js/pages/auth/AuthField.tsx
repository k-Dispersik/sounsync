interface Props {
    id: string;
    label: string;
    type: "text" | "email" | "password";
    value: string;
    autoComplete: string;
    errors?: string[];
    onChange: (value: string) => void;
}

export default function AuthField({
    id,
    label,
    type,
    value,
    autoComplete,
    errors,
    onChange,
}: Props) {
    const errorId = `${id}-error`;
    const invalid = Boolean(errors?.length);

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs text-base-content/50">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                autoComplete={autoComplete}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(event) => onChange(event.target.value)}
                className="field w-full"
            />
            {invalid && (
                <p id={errorId} className="text-xs text-error">
                    {errors?.join(", ")}
                </p>
            )}
        </div>
    );
}
