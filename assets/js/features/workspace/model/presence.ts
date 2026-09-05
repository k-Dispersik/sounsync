import { z } from "zod";

/**
 * Who is in the workspace, as the server publishes it.
 *
 * Presence is tracked per session, so one person with two tabs open appears
 * twice — which is right for cursors and wrong for a list of faces. Avatars
 * therefore fold sessions back into people; cursors do not.
 */
export const presenceMetaSchema = z.object({
    user_id: z.number(),
    name: z.string(),
    session_id: z.string(),
    color_hue: z.number(),
    joined_at: z.string(),
});

export const presenceStateSchema = z.record(
    z.string(),
    z.object({ metas: z.array(presenceMetaSchema) }),
);

export type PresenceState = z.infer<typeof presenceStateSchema>;

export interface Participant {
    userId: number;
    name: string;
    colorHue: number;
    /** How many tabs this person has open. */
    sessions: number;
}

/** One entry per person, in the order they arrived. */
export function toParticipants(state: unknown): Participant[] {
    const parsed = presenceStateSchema.safeParse(state);

    if (!parsed.success) return [];

    const byUser = new Map<number, Participant & { joinedAt: string }>();

    for (const { metas } of Object.values(parsed.data)) {
        for (const meta of metas) {
            const existing = byUser.get(meta.user_id);

            if (existing) {
                existing.sessions += 1;
                existing.joinedAt =
                    meta.joined_at < existing.joinedAt ? meta.joined_at : existing.joinedAt;
            } else {
                byUser.set(meta.user_id, {
                    userId: meta.user_id,
                    name: meta.name,
                    colorHue: meta.color_hue,
                    sessions: 1,
                    joinedAt: meta.joined_at,
                });
            }
        }
    }

    return [...byUser.values()]
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
        .map(({ joinedAt: _joinedAt, ...participant }) => participant);
}

/** The colour everyone shows this person in. */
export function participantColor(colorHue: number): string {
    // Dark enough for white initials to read on it: an avatar is a
    // 28px circle with 11px text, which is where contrast is won or lost.
    return `hsl(${colorHue} 65% 30%)`;
}

/** Initials for an avatar: at most two, from the start of each word. */
export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");
}
