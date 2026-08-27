import { createLogger } from "@/shared/lib/logger";
import type { Clip, Project, Track } from "@/shared/types";
import {
    OPERATIONS,
    operationPayloadSchemas,
    type OperationEvent,
    type OperationType,
} from "./operations";

const log = createLogger("Operations");

/**
 * Applies one operation to the project, returning a new project.
 *
 * Pure, so the interesting cases — an operation for a track that is not here,
 * an unknown type, a payload that does not match — are all testable without a
 * socket. An operation that cannot be applied leaves the project untouched and
 * says so in the log: guessing would be worse than a moment out of date, and
 * the next snapshot puts things right.
 */
export function applyOperation(project: Project, event: OperationEvent): Project {
    const schema = operationPayloadSchemas[event.type as OperationType];

    if (!schema) {
        log.warn(`ignoring unknown operation ${event.type}`);
        return project;
    }

    const parsed = schema.safeParse(event.payload);

    if (!parsed.success) {
        log.error(`operation ${event.type} had an unexpected payload`, parsed.error.issues);
        return project;
    }

    const next = reduce(project, event.type as OperationType, parsed.data);

    return next === project ? project : { ...next, version: event.version };
}

function reduce(project: Project, type: OperationType, payload: unknown): Project {
    switch (type) {
        case OPERATIONS.TRACK_CREATE:
            return withTracks(project, [...project.tracks, payload as Track]);

        case OPERATIONS.TRACK_DELETE: {
            const { track_id } = payload as { track_id: number };
            return withTracks(
                project,
                project.tracks.filter((track) => track.id !== track_id),
            );
        }

        case OPERATIONS.CLIP_CREATE: {
            const clip = payload as Clip;
            return mapTrack(project, clip.track_id, (track) => ({
                ...track,
                // A clip we already hold means our own echo, or a repeat.
                clips: track.clips.some((existing) => existing.id === clip.id)
                    ? track.clips
                    : [...track.clips, clip],
            }));
        }

        case OPERATIONS.CLIP_MOVE:
        case OPERATIONS.CLIP_UPDATE:
            return replaceClip(project, payload as Clip);

        case OPERATIONS.CLIP_DELETE: {
            const { clip_id, track_id } = payload as { clip_id: number; track_id: number };
            return mapTrack(project, track_id, (track) => ({
                ...track,
                clips: track.clips.filter((clip) => clip.id !== clip_id),
            }));
        }

        case OPERATIONS.SETTINGS_UPDATE:
            return { ...project, settings: (payload as Project).settings };
    }
}

// A clip can be moved between tracks, so it is removed everywhere and then put
// where the operation says it now belongs.
function replaceClip(project: Project, clip: Clip): Project {
    if (!project.tracks.some((track) => track.id === clip.track_id)) {
        log.warn(`clip ${clip.id} belongs to track ${clip.track_id}, which is not in the project`);
        return project;
    }

    const withoutClip = project.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((existing) => existing.id !== clip.id),
    }));

    return withTracks(
        project,
        withoutClip.map((track) =>
            track.id === clip.track_id ? { ...track, clips: [...track.clips, clip] } : track,
        ),
    );
}

function mapTrack(project: Project, trackId: number | undefined, update: (t: Track) => Track) {
    if (!project.tracks.some((track) => track.id === trackId)) {
        log.warn(`operation refers to track ${trackId}, which is not in the project`);
        return project;
    }

    return withTracks(
        project,
        project.tracks.map((track) => (track.id === trackId ? update(track) : track)),
    );
}

function withTracks(project: Project, tracks: Track[]): Project {
    return { ...project, tracks };
}
