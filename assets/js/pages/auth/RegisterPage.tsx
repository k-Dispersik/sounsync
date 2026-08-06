import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { describeAuthError, type FieldErrors } from "@/shared/auth/api";
import { useAuth } from "@/shared/auth/AuthProvider";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";

export default function RegisterPage() {
    const { status, register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    if (status === "authenticated") return <Navigate to="/" replace />;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setFields({});

        register({ name, email, password })
            .then(() => navigate("/", { replace: true }))
            .catch((cause: unknown) => {
                const described = describeAuthError(cause);
                setError(described.message);
                setFields(described.fields);
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle={
                <>
                    Already have one?{" "}
                    <Link to="/login" className="text-primary">
                        Sign in
                    </Link>
                </>
            }
            error={error}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Create account"
        >
            <AuthField
                id="name"
                label="Name"
                type="text"
                value={name}
                autoComplete="name"
                errors={fields.name}
                onChange={setName}
            />
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
                autoComplete="new-password"
                errors={fields.password}
                onChange={setPassword}
            />
        </AuthLayout>
    );
}
