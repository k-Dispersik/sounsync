import type { Clip, Track, ProjectSettings } from "js/shared/types";

export const RealtimeEvents = {
    CURSOR_MOVE: "workspace:cursor:move",
    CURSOR_CLICK: "workspace:cursor:click",
    PEER_CONNECTED: "workspace:peer:connected",
    PEER_DISCONNECTED: "workspace:peer:disconnected",
    PROJECT_SETTINGS_UPDATED: "workspace:project_settings:updated",
    TRACK_ADDED: "workspace:track:added",
    TRACK_REMOVED: "workspace:track:removed",
    CLIP_MOVED: "workspace:clip:moved",
    CLIP_CREATED: "workspace:clip:created",
} as const;

export type RealtimeEventName = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

// Typed event union — all bus communication must use these shapes
export type WorkspaceEvent =
    | { type: "cursor_move"; payload: { session_id: string; x: number; y: number } }
    | { type: "cursor_click"; payload: { session_id: string; x: number; y: number } }
    | { type: "peer_connected"; payload: { session_id: string } }
    | { type: "peer_disconnected"; payload: { session_id: string } }
    | {
          type: "project_settings_updated";
          payload: { session_id: string; settings: ProjectSettings };
      }
    | { type: "track_added"; payload: { session_id: string; track: Track } }
    | { type: "track_removed"; payload: { session_id: string; track_id: number } }
    | {
          type: "clip_moved";
          payload: { session_id: string; clip_id: number; track_id: number; start_time: number };
      }
    | { type: "clip_created"; payload: { session_id: string; track_id: number; clip: Clip } };
