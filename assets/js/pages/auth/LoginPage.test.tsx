import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "js/shared/auth/api";
import { AuthProvider } from "js/shared/auth/AuthProvider";
import LoginPage from "./LoginPage";

vi.mock("js/shared/auth/api", async (importOriginal) => ({
    ...(await importOriginal<typeof api>()),
    login: vi.fn(),
    fetchCurrentUser: vi.fn(),
}));

const renderPage = () =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<div>workspace</div>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    );

async function submit(email: string, password: string) {
    await userEvent.type(screen.getByLabelText("Email"), email);
    await userEvent.type(screen.getByLabelText("Password"), password);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
    beforeEach(() => localStorage.clear());

    it("sends the credentials and lands on the app", async () => {
        vi.mocked(api.login).mockResolvedValue({
            token: "t",
            user: { id: 1, name: "Ada", email: "ada@example.com" },
        });

        renderPage();
        await submit("ada@example.com", "password123");

        expect(api.login).toHaveBeenCalledWith({
            email: "ada@example.com",
            password: "password123",
        });
        await waitFor(() => expect(screen.getByText("workspace")).toBeInTheDocument());
    });

    it("shows what the server said instead of a silent failure", async () => {
        vi.mocked(api.login).mockRejectedValue(new Error("nope"));

        renderPage();
        await submit("ada@example.com", "wrong");

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    });
});
