import type { ViradasMode } from './index'

export interface GrooveSuggestion {
  pianoSteps: number[]   // posições step16 (0-15)
  pianoDur: number       // duração em ticks @ TPQ=480
  bassSteps: number[]
  bassDur: number
  swing: number          // 50 (reto) a 75 (heavy swing)
  viradas: ViradasMode
}

export interface SuggestedProgression {
  id: string
  name: string
  mood: string
  chords: string[]
  groove?: GrooveSuggestion
}

export interface TabState {
  id: string
  label: string
  chords: string[]
  progressionName: string
  groove?: GrooveSuggestion
}
