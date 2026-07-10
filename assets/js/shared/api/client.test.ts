import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { writeToken, readToken } from "js/shared/auth/storage";
import apiClient, { setUnauthorizedHandler } from "./client";

let mock: MockAdapter;

beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(apiClient);
});

afterEach(() => {
    mock.restore();
    setUnauthorizedHandler(null);
});

describe("apiClient", () => {
    it("attaches the stored token to every request", async () => {
        writeToken("stored-token");
        mock.onGet("/projects").reply(200, []);

        await apiClient.get("/projects");

        expect(mock.history.get[0]?.headers?.Authorization).toBe("Bearer stored-token");
    });

    it("sends no header when there is no token", async () => {
        mock.onGet("/projects").reply(200, []);

        await apiClient.get("/projects");

        expect(mock.history.get[0]?.headers?.Authorization).toBeUndefined();
    });

    it("drops the token and reports a dead session on 401", async () => {
        writeToken("stale-token");
        const onUnauthorized = vi.fn();
        setUnauthorizedHandler(onUnauthorized);
        mock.onGet("/projects").reply(401, { error: "Unauthorized" });

        await expect(apiClient.get("/projects")).rejects.toThrow();

        expect(readToken()).toBeNull();
        expect(onUnauthorized).toHaveBeenCalledOnce();
    });

    it("leaves a failed sign in alone", async () => {
        const onUnauthorized = vi.fn();
        setUnauthorizedHandler(onUnauthorized);
        mock.onPost("/auth/login").reply(401, { error: "Invalid email or password" });

        await expect(apiClient.post("/auth/login", {})).rejects.toThrow();

        expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it("passes other failures through untouched", async () => {
        writeToken("good-token");
        const onUnauthorized = vi.fn();
        setUnauthorizedHandler(onUnauthorized);
        mock.onGet("/projects").reply(500);

        await expect(apiClient.get("/projects")).rejects.toThrow();

        expect(readToken()).toBe("good-token");
        expect(onUnauthorized).not.toHaveBeenCalled();
    });
});
