// The shapes the API actually returns are defined once, as zod schemas; the
// types here are inferred from them so the two cannot drift apart.
export type {
    AudioFile,
    Clip,
    Project,
    ProjectSettings,
    ProjectSummary,
    Track,
    UploadAnnouncement,
    UploadInstruction,
    User,
} from "@/shared/api/schemas";

export { TIME_SIGNATURES } from "./timeSignature";
export type { TimeSignatureValue } from "./timeSignature";
