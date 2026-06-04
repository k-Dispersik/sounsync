import { SynthPatch } from "./types";

export class SoundBank {
    private patches = new Map<string, SynthPatch>();

    async loadFromUrl(name: string, url: string) {
        const res = await fetch(url);
        const json = await res.json();

        const patch: SynthPatch = {
            kind: "synth",
            osc: json.osc,
            env: json.env,
        };

        this.patches.set(name, patch);
    }

    get(name: string): SynthPatch | undefined {
        return this.patches.get(name);
    }
}