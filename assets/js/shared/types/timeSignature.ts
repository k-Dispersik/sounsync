export const TIME_SIGNATURES = [
    "2/4",
    "3/4",
    "4/4",
    "3/8",
    "6/8",
    "9/8",
    "12/8",
    "5/4",
    "5/8",
    "7/4",
    "7/8",
    "3/2",
    "4/2",
] as const;

export type TimeSignatureValue = (typeof TIME_SIGNATURES)[number];
