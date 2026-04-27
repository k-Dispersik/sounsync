import type { Track } from "./track";

export interface Project {
    id: number;
    title: string;
    description: string | null;
    tracks: Track[];
}