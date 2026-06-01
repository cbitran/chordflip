import * as Tone from 'tone'
import type { Timbre } from '../types'

export interface TimbreConfig {
  synth: Tone.PolySynth
  cleanup: () => void
}

export function createTimbreSynth(timbre: Timbre): TimbreConfig {
  let synth: Tone.PolySynth

  switch (timbre) {
    case 'pad': {
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination()
      const chorus = new Tone.Chorus(3, 2.5, 0.4).connect(reverb).start()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.4, decay: 0.3, sustain: 0.8, release: 2.0 },
      }).connect(chorus)
      synth.volume.value = -10
      return {
        synth,
        cleanup: () => { synth.dispose(); chorus.dispose(); reverb.dispose() },
      }
    }
    case 'pluck': {
      const delay = new Tone.FeedbackDelay('8n', 0.2).toDestination()
      delay.wet.value = 0.15
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.3 },
      }).connect(delay)
      synth.volume.value = -8
      return {
        synth,
        cleanup: () => { synth.dispose(); delay.dispose() },
      }
    }
    case 'lead': {
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
      }).connect(reverb)
      synth.volume.value = -14
      return {
        synth,
        cleanup: () => { synth.dispose(); reverb.dispose() },
      }
    }
    case 'piano':
    default: {
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 24 } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.03, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).connect(reverb)
      synth.volume.value = -13
      return {
        synth,
        cleanup: () => { synth.dispose(); reverb.dispose() },
      }
    }
  }
}
