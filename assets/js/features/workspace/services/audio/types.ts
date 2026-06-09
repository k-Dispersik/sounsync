export type OscType = OscillatorType;

export type SynthPatch = {
    kind: "synth";
    osc: {
        type: OscType;
        startFreq: number;
        endFreq: number;
    };
    env: {
        decay: number;
    };
};

export type SamplePatch = {
    kind: "sample";
    url: string;
};

export type SoundPatch = SynthPatch | SamplePatch;

export type SchedulerEvent = {
    time: number; // ms
    sound: SoundPatch;
    __played?: boolean;
};
