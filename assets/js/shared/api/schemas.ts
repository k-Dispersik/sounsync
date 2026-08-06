import { z } from "zod";

import { TIME_SIGNATURES } from "@/shared/types/timeSignature";

/**
 * Every API response is parsed through one of these before the app sees it.
 *
 * The point is not politeness towards the server: it is that a missing or
 * renamed field then fails at the boundary with a message naming the field,
 * instead of surfacing three components later as `undefined is not an object`.
 * Types are inferred from the schemas, so the two cannot drift apart.
 */

export const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
});

export const projectSettingsSchema = z.object({
    bpm: z.number(),
    time_signature: z.enum(TIME_SIGNATURES),
    timeline_length_ms: z.number(),
});

export const clipSchema = z.object({
    id: z.number(),
    title: z.string().nullable(),
    type: z.string(),
    start_time: z.number(),
    duration: z.number(),
    file_path: z.string().nullable(),
    settings: z.unknown().optional(),
    track_id: z.number().optional(),
});

// Required, not optional: every endpoint that returns a track returns it with
// its clips loaded. If one ever stops, the parse should say so rather than let
// an `undefined` travel into the timeline.
export const trackSchema = z.object({
    id: z.number(),
    project_id: z.number(),
    row_index: z.number(),
    clips: z.array(clipSchema),
});

const projectFields = {
    id: z.number(),
    title: z.string(),
    description: z.string().nullable(),
    settings: projectSettingsSchema,
};

/** What a list returns: the project's own fields, no associations. */
export const projectSummarySchema = z.object(projectFields);

/** What a single project returns: associations included. */
export const projectSchema = z.object({
    ...projectFields,
    tracks: z.array(trackSchema),
});

export const sessionSchema = z.object({
    token: z.string(),
    user: userSchema,
});

export const apiErrorSchema = z.object({
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.array(z.string())).optional(),
        request_id: z.string().nullable().optional(),
    }),
});

export type User = z.infer<typeof userSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type Track = z.infer<typeof trackSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type Project = z.infer<typeof projectSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
