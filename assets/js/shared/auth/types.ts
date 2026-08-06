import type { User } from "@/shared/api/schemas";

export type AuthUser = User;

export interface Credentials {
    email: string;
    password: string;
}

export interface Registration extends Credentials {
    name: string;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";
