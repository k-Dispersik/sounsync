import { Logo } from "@/shared/components/Logo";

interface Props {
    title: string;
    subtitle: React.ReactNode;
    error: string | null;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    submitting: boolean;
    submitLabel: string;
    children: React.ReactNode;
}

export default function AuthLayout(props: Props) {
    const { title, subtitle, error, onSubmit, submitting, submitLabel, children } = props;

    return (
        <main className="min-h-screen flex items-center justify-center bg-base-100 px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Logo size={20} />
                </div>

                <h1 className="text-lg font-semibold text-base-content mb-1">{title}</h1>
                <p className="text-sm text-base-content/50 mb-6">{subtitle}</p>

                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                    {children}

                    {error && (
                        <p role="alert" className="text-sm text-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-9 rounded-md bg-primary text-primary-content text-sm font-medium
                            disabled:opacity-50 transition-opacity"
                    >
                        {submitting ? "Please wait…" : submitLabel}
                    </button>
                </form>
            </div>
        </main>
    );
}
