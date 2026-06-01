import type { Extension } from '../types'
import { NOTE_NAMES } from './parser'

export function reVoice(intervals: number[], ext: Extension): number[] {
  const third = intervals.includes(3) ? 3
    : intervals.includes(4) ? 4
    : intervals.includes(2) ? 2
    : intervals.includes(5) ? 5 : 4

  const fifth = intervals.includes(8) ? 8
    : intervals.includes(6) ? 6 : 7

  const tri = [0, third, fifth]
  if (ext === 'tri') return tri

  const sev = intervals.includes(11) ? 11
    : intervals.includes(10) ? 10
    : (third === 4 && fifth === 7) ? 11 : 10

  const c7 = [...tri, sev]

  if (ext === '9') return [...c7, 14]
  if (ext === '11') return [...c7, 14, 17]
  return c7
}

export function nameChord(root: number, iv: number[]): string {
  const h = (x: number) => iv.includes(x)
  let q = ''

  if (h(3) && h(6) && h(10)) return NOTE_NAMES[root]! + 'm7♭5'
  if (h(3) && h(6) && h(9)) return NOTE_NAMES[root]! + '°7'
  if (h(3) && h(6)) q = 'dim'
  else if (h(3)) q = 'm'
  else if (h(4) && h(8)) q = '+'

  if (h(11)) q += q.startsWith('m') ? '(maj7)' : 'maj7'
  else if (h(10)) q += '7'

  if (h(14) && h(17)) q += '(11)'
  else if (h(14)) q += '(9)'

  if (h(2) && !h(3) && !h(4)) q = 'sus2'
  if (h(5) && !h(3) && !h(4)) q = 'sus4'

  return NOTE_NAMES[root]! + q
}

export function classifyChord(_root: number, iv: number[]): 'major' | 'minor' | 'dim' | 'aug' {
  if (iv.includes(3) && iv.includes(6)) return 'dim'
  if (iv.includes(4) && iv.includes(8)) return 'aug'
  if (iv.includes(3)) return 'minor'
  return 'major'
}
