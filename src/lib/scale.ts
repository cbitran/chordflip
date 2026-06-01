import { NOTE_NAMES } from '../core/parser'

// Intervalos dos 7 modos diatônicos
export type ScaleMode = 'major' | 'minor' | 'dorian' | 'mixolydian' | 'lydian' | 'phrygian' | 'locrian'

const MODE_INTERVALS: Record<ScaleMode, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
}

// Qualidade diatônica de cada grau por modo
const DEGREE_QUALITIES: Record<ScaleMode, string[]> = {
  major:      ['maj', 'm', 'm', 'maj', 'maj', 'm', 'dim'],
  minor:      ['m', 'dim', 'maj', 'm', 'm', 'maj', 'maj'],
  dorian:     ['m', 'm', 'maj', 'maj', 'm', 'dim', 'maj'],
  mixolydian: ['maj', 'm', 'dim', 'maj', 'm', 'm', 'maj'],
  lydian:     ['maj', 'maj', 'm', 'dim', 'maj', 'm', 'm'],
  phrygian:   ['m', 'maj', 'maj', 'm', 'dim', 'maj', 'm'],
  locrian:    ['dim', 'maj', 'm', 'm', 'maj', 'maj', 'm'],
}

// Nomes dos graus por modo
const DEGREE_NAMES: Record<ScaleMode, string[]> = {
  major:      ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  minor:      ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  dorian:     ['i', 'ii', 'III', 'IV', 'v', 'vi°', 'VII'],
  mixolydian: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'VII'],
  lydian:     ['I', 'II', 'iii', 'iv°', 'V', 'vi', 'vii'],
  phrygian:   ['i', 'II', 'III', 'iv', 'v°', 'VI', 'vii'],
  locrian:    ['i°', 'II', 'iii', 'iv', 'V', 'VI', 'vii'],
}

export interface ScaleDegree {
  degree: number        // 0–6
  roman: string         // 'I', 'ii', 'V', etc.
  root: number          // pitch class 0–11
  rootName: string      // 'C', 'F#', etc.
  quality: string       // 'maj', 'm', 'dim'
  intervals: number[]   // intervalos do acorde base
}

export interface Scale {
  tonic: number
  tonicName: string
  mode: ScaleMode
  degrees: ScaleDegree[]
}

const QUALITY_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
}

export function buildScale(tonic: number, mode: ScaleMode = 'major'): Scale {
  const intervals = MODE_INTERVALS[mode]
  const qualities = DEGREE_QUALITIES[mode]
  const romans = DEGREE_NAMES[mode]

  const degrees: ScaleDegree[] = intervals.map((interval, i) => {
    const root = (tonic + interval) % 12
    const quality = qualities[i]!
    return {
      degree: i,
      roman: romans[i]!,
      root,
      rootName: NOTE_NAMES[root]!,
      quality,
      intervals: QUALITY_INTERVALS[quality] ?? [0, 4, 7],
    }
  })

  return { tonic, tonicName: NOTE_NAMES[tonic]!, mode, degrees }
}

// Detecta escala mais provável a partir dos acordes
export function detectScale(chords: { root: number; intervals: number[] }[]): Scale {
  if (!chords.length) return buildScale(0, 'major')

  // Usa a raiz do primeiro acorde como tônica provisória
  const tonic = chords[0]!.root

  // Verifica se parece maior ou menor pelo primeiro acorde
  const firstIsMinor = chords[0]!.intervals.includes(3) && !chords[0]!.intervals.includes(4)
  const mode: ScaleMode = firstIsMinor ? 'minor' : 'major'

  return buildScale(tonic, mode)
}

// Retorna o grau mais próximo para um acorde dado dentro da escala
export function findDegreeForChord(chord: { root: number }, scale: Scale): number {
  const idx = scale.degrees.findIndex(d => d.root === chord.root % 12)
  return idx >= 0 ? idx : 0
}
