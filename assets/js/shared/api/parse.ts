import type { ZodType } from "zod";

import { createLogger } from "@/shared/lib/logger";

const log = createLogger("Api");

export class ResponseShapeError extends Error {
    constructor(
        readonly endpoint: string,
        readonly issues: string,
    ) {
        super(`${endpoint} answered with an unexpected shape: ${issues}`);
        this.name = "ResponseShapeError";
    }
}

/**
 * Parses a response body against its schema.
 *
 * Throwing here is deliberate. A body that does not match is a broken contract,
 * and failing at the boundary — with the offending field named — is far cheaper
 * to debug than the `undefined` it would otherwise become somewhere in a
 * component.
 */
export function parseResponse<T>(schema: ZodType<T>, endpoint: string, body: unknown): T {
    const result = schema.safeParse(body);

    if (result.success) return result.data;

    const issues = result.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");

    log.error(`${endpoint} returned an unexpected shape`, issues);

    throw new ResponseShapeError(endpoint, issues);
}
