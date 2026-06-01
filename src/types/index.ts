export interface ParsedChord {
  root: number
  intervals: number[]
  tok: string
  ok: boolean
}

export interface ReharmChord extends ParsedChord {
  name: string
  reharmonizedIntervals: number[]
}

export type Extension = 'tri' | '7' | '9' | '11'

export type ViradasMode = 'off' | 'antecip' | 'full'

export interface MidiEvent {
  tick: number
  duration: number
  note: number
  velocity: number
}

export interface InstrumentPreset {
  label: string
  role: 'harmony' | 'bass' | 'pad'
  pianoBase?: number
  bassBase?: number
  steps: number[]
  duration: number
  sub?: boolean
  tip: string
}

export interface GenreDefinition {
  bpm: number
  ext: Extension
  pianoBase: number
  bassBase: number
  pianoSteps: number[]
  pianoDur: number
  bassSteps: number[]
  bassDur: number
  sub: boolean
  inst: Record<string, string>
}

export interface Section {
  id: string
  name: string
  text: string
  genreName: string
  extOverride: Extension | null
  bpmOverride: number | null
  swing: number
  viradas: ViradasMode
}

export interface ProgressionVariant {
  id: string
  name: string
  description: string
  chords: ReharmChord[]
  character: string
}

export type Timbre = 'pad' | 'pluck' | 'lead' | 'piano'
export type TrackId = 'kick' | 'chords' | 'bass'

// --- AI Coach ---

export interface AISession {
  song: { artist: string; title: string } | null
  style: string
  bpm: number
  feeling: string[]
  chords: string[]
  tonicNum: number | null
}

export type AIStatus = 'idle' | 'loading' | 'active' | 'dismissed'

export interface AISuggestion {
  chords: string[]
  explanation: string
}

export type BadgeLevel = 'good' | 'ok' | 'bad'

export interface ChordBadgeData {
  chord: string
  level: BadgeLevel
  explanation: string
}

export interface AIContextValue {
  status: AIStatus
  session: AISession
  suggestion: AISuggestion | null
  badges: Record<string, ChordBadgeData>
  wizardOpen: boolean
  panelOpen: boolean
  updateSession: (patch: Partial<AISession>) => void
  callAI: () => void
  acceptSuggestion: (onApply: (chords: string[]) => void) => void
  dismissAI: () => void
}
