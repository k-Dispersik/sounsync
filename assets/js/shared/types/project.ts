import type { Track } from "./track";

export interface ProjectSettings {
    BPM: number;
}

export interface Project {
    id: number;
    title: string;
    description: string | null;
    settings: ProjectSettings | null;
    tracks: Track[];
}