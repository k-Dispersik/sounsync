import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { describeAuthError, type FieldErrors } from "js/shared/auth/api";
import { useAuth } from "js/shared/auth/AuthProvider";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";

interface LocationState {
    from?: string;
}

export default function LoginPage() {
    const { status, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    if (status === "authenticated") {
        return <Navigate to={(location.state as LocationState)?.from ?? "/"} replace />;
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setFields({});

        login({ email, password })
            .then(() => navigate((location.state as LocationState)?.from ?? "/", { replace: true }))
            .catch((cause: unknown) => {
                const described = describeAuthError(cause);
                setError(described.message);
                setFields(described.fields);
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <AuthLayout
            title="Sign in"
            subtitle={
                <>
                    No account yet?{" "}
                    <Link to="/register" className="text-primary">
                        Create one
                    </Link>
                </>
            }
            error={error}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Sign in"
        >
            <AuthField
                id="email"
                label="Email"
                type="email"
                value={email}
                autoComplete="email"
                errors={fields.email}
                onChange={setEmail}
            />
            <AuthField
                id="password"
                label="Password"
                type="password"
                value={password}
                autoComplete="current-password"
                errors={fields.password}
                onChange={setPassword}
            />
        </AuthLayout>
    );
}
