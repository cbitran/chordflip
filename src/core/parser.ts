import type { ParsedChord } from '../types'

const PC_ROOT: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9,
  'A#': 10, Bb: 10, B: 11,
}

const QUALITY_MAP: Record<string, number[]> = {
  '': [0, 4, 7],
  maj: [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '+': [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  sus: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  '9': [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  m9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14],
  '11': [0, 4, 7, 10, 14, 17],
  maj11: [0, 4, 7, 11, 14, 17],
  m11: [0, 3, 7, 10, 14, 17],
}

export function parseChord(token: string): ParsedChord | null {
  const match = token.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return null
  const root = PC_ROOT[match[1]!]
  if (root === undefined) return null
  const rest = (match[2] ?? '').split('/')[0]!
  const intervals = QUALITY_MAP[rest]
  if (intervals === undefined) {
    return { root, intervals: [0, 4, 7], tok: token, ok: false }
  }
  return { root, intervals, tok: token, ok: true }
}

export function parseProg(text: string): { chords: ParsedChord[]; bad: string[] } {
  const tokens = text.replace(/[\[\]|]/g, ' ').split(/[\s,]+/).filter(Boolean)
  const chords: ParsedChord[] = []
  const bad: string[] = []
  tokens.forEach(t => {
    const c = parseChord(t)
    if (c && c.ok) chords.push(c)
    else bad.push(t)
  })
  return { chords, bad }
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
