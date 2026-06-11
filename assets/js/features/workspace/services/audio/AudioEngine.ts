import { SynthPatch, SoundPatch } from "./types";
import { SampleBank } from "./SampleBank";

export class AudioEngine {
    constructor(
        private ctx: AudioContext,
        private samples: SampleBank,
    ) {}

    play(patch: SoundPatch) {
        if (patch.kind === "synth") {
            this.playSynth(patch);
        } else {
            this.playSample(patch);
        }
    }

    private playSynth(patch: SynthPatch) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = patch.osc.type;

        osc.frequency.setValueAtTime(patch.osc.startFreq, this.ctx.currentTime);

        osc.frequency.exponentialRampToValueAtTime(
            patch.osc.endFreq,
            this.ctx.currentTime + patch.env.decay,
        );

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + patch.env.decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + patch.env.decay);
    }

    private playSample(patch: { url: string }) {
        const buffer = this.samples.get(patch.url);

        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);

        source.start();
    }
}
