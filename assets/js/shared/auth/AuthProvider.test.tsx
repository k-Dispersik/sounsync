import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "./api";
import { AuthProvider, useAuth } from "./AuthProvider";
import { readToken, writeToken } from "./storage";

vi.mock("./api", async (importOriginal) => ({
    ...(await importOriginal<typeof api>()),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    fetchCurrentUser: vi.fn(),
}));

const user = { id: 1, name: "Ada", email: "ada@example.com" };

function Probe() {
    const auth = useAuth();

    return (
        <div>
            <span data-testid="status">{auth.status}</span>
            <span data-testid="user">{auth.user?.email ?? "-"}</span>
            <button onClick={() => void auth.login({ email: "ada@example.com", password: "pw" })}>
                sign in
            </button>
            <button onClick={() => void auth.logout()}>sign out</button>
        </div>
    );
}

const renderProbe = () =>
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>,
    );

describe("AuthProvider", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("reports anonymous when there is no stored token", async () => {
        renderProbe();

        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
        expect(api.fetchCurrentUser).not.toHaveBeenCalled();
    });

    it("checks a stored token with the server before trusting it", async () => {
        writeToken("stored-token");
        vi.mocked(api.fetchCurrentUser).mockResolvedValue(user);

        renderProbe();

        await waitFor(() =>
            expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
        );
        expect(api.fetchCurrentUser).toHaveBeenCalledWith("stored-token");
        expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com");
    });

    it("throws away a token the server no longer accepts", async () => {
        writeToken("revoked");
        vi.mocked(api.fetchCurrentUser).mockRejectedValue(new Error("401"));

        renderProbe();

        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
        expect(readToken()).toBeNull();
    });

    it("stores the token handed out on sign in", async () => {
        vi.mocked(api.login).mockResolvedValue({ token: "fresh-token", user });
        renderProbe();
        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));

        await userEvent.click(screen.getByText("sign in"));

        await waitFor(() => expect(readToken()).toBe("fresh-token"));
        expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com");
    });

    it("signs out locally even when the server call fails", async () => {
        writeToken("stored-token");
        vi.mocked(api.fetchCurrentUser).mockResolvedValue(user);
        vi.mocked(api.logout).mockRejectedValue(new Error("network"));
        renderProbe();
        await waitFor(() =>
            expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
        );

        await userEvent.click(screen.getByText("sign out"));

        await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
        expect(readToken()).toBeNull();
    });
});
