import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { describeAuthError } from "./api";

function apiError(status: number, data: unknown): AxiosError {
    const config = { headers: new AxiosHeaders() };

    return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
        status,
        statusText: "",
        headers: {},
        config,
        data,
    });
}

describe("describeAuthError", () => {
    it("reads the message and field errors out of the error envelope", () => {
        const described = describeAuthError(
            apiError(422, {
                error: {
                    code: "validation_failed",
                    message: "Registration failed",
                    details: { email: ["has already been taken"] },
                },
            }),
        );

        expect(described.message).toBe("Registration failed");
        expect(described.fields.email).toEqual(["has already been taken"]);
    });

    it("tells an unreachable server apart from a rejected request", () => {
        const offline = new AxiosError("Network Error", "ERR_NETWORK");

        expect(describeAuthError(offline).message).toMatch(/connection/i);
    });

    it("falls back to a generic sentence for anything unrecognisable", () => {
        expect(describeAuthError(new Error("boom")).message).toMatch(/went wrong/i);
        expect(describeAuthError(apiError(500, {})).message).toMatch(/went wrong/i);
    });
});
