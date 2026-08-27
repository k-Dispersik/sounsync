import { z } from "zod";

import { clipSchema, projectSettingsSchema, trackSchema } from "@/shared/api/schemas";

/**
 * The edits the server accepts, named the way the editor thinks about them.
 *
 * This list mirrors the server's registry: an operation that is not here
 * cannot be sent, and one that arrives unrecognised is dropped loudly rather
 * than applied on a guess.
 */
export const OPERATIONS = {
    TRACK_CREATE: "track.create",
    TRACK_DELETE: "track.delete",
    CLIP_CREATE: "clip.create",
    CLIP_MOVE: "clip.move",
    CLIP_UPDATE: "clip.update",
    CLIP_DELETE: "clip.delete",
    SETTINGS_UPDATE: "project.settings.update",
} as const;

export type OperationType = (typeof OPERATIONS)[keyof typeof OPERATIONS];

/** What the server sends back after an edit, to the author and to everyone else. */
export const operationEventSchema = z.object({
    type: z.string(),
    version: z.number(),
    client_id: z.string().nullable().optional(),
    payload: z.unknown(),
});

export type OperationEvent = z.infer<typeof operationEventSchema>;

export const trackDeletedSchema = z.object({ track_id: z.number() });
export const clipDeletedSchema = z.object({ clip_id: z.number(), track_id: z.number() });
export const settingsUpdatedSchema = z.object({ settings: projectSettingsSchema });

export const operationPayloadSchemas = {
    [OPERATIONS.TRACK_CREATE]: trackSchema,
    [OPERATIONS.TRACK_DELETE]: trackDeletedSchema,
    [OPERATIONS.CLIP_CREATE]: clipSchema,
    [OPERATIONS.CLIP_MOVE]: clipSchema,
    [OPERATIONS.CLIP_UPDATE]: clipSchema,
    [OPERATIONS.CLIP_DELETE]: clipDeletedSchema,
    [OPERATIONS.SETTINGS_UPDATE]: settingsUpdatedSchema,
} as const;
