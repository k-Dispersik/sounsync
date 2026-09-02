import type { Project } from "@/shared/types";
import type { ScheduledEvent } from "./Scheduler";

/**
 * Everything playback needs from a project: what to play, and what to fetch
 * before it can be played.
 */
export interface CompiledProject {
    events: ScheduledEvent[];
    samples: { key: string; url: string }[];
}

/**
 * Turns a project into a list of things to play.
 *
 * Pure, and deliberately the only place that decides what a clip means for the
 * ear. Clips without audio behind them are dropped rather than turned into
 * silence at a position: a placeholder that occupies the mixer is harder to
 * explain than one that simply is not there yet.
 */
export function compileProject(project: Project | null | undefined): CompiledProject {
    if (!project) return { events: [], samples: [] };

    const events: ScheduledEvent[] = [];
    const samples = new Map<string, string>();

    for (const track of project.tracks) {
        for (const clip of track.clips) {
            if (clip.audio_file_id == null) continue;

            const key = String(clip.audio_file_id);

            samples.set(key, sampleUrl(project.id, clip.audio_file_id));

            events.push({
                id: String(clip.id),
                timeMs: Math.max(0, clip.start_time),
                durationMs: clip.duration,
                trackId: track.id,
                source: { kind: "sample", bufferKey: key },
                gain: 1,
            });
        }
    }

    return {
        // In time order, so the scheduler's window walks forwards through them.
        events: events.sort((a, b) => a.timeMs - b.timeMs),
        samples: [...samples].map(([key, url]) => ({ key, url })),
    };
}

export function sampleUrl(projectId: number, audioFileId: number): string {
    return `/v1/projects/${projectId}/audio_files/${audioFileId}/content`;
}
