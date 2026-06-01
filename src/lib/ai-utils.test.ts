import { describe, it, expect } from 'vitest'
import { sessionIsEmpty, parseGroqBadges } from './ai-utils'
import type { AISession, ChordBadgeData } from '../types'

const emptySession: AISession = {
  song: null,
  style: 'House',
  bpm: 124,
  feeling: [],
  chords: [],
  tonicNum: null,
}

describe('sessionIsEmpty', () => {
  it('returns true when session has no song and no chords', () => {
    expect(sessionIsEmpty(emptySession)).toBe(true)
  })

  it('returns false when session has a song', () => {
    expect(sessionIsEmpty({ ...emptySession, song: { artist: 'Lionel Richie', title: 'Stuck on You' } })).toBe(false)
  })

  it('returns false when session has chords', () => {
    expect(sessionIsEmpty({ ...emptySession, chords: ['Fmaj7', 'Am7'] })).toBe(false)
  })
})

describe('parseGroqBadges', () => {
  it('maps groq badge array to Record keyed by chord label', () => {
    const raw: ChordBadgeData[] = [
      { chord: 'Fmaj9', level: 'good', explanation: 'Tônico perfeito' },
      { chord: 'Am11', level: 'ok', explanation: 'Funciona com cuidado' },
    ]
    const result = parseGroqBadges(raw)
    expect(result['Fmaj9'].level).toBe('good')
    expect(result['Am11'].explanation).toBe('Funciona com cuidado')
  })

  it('returns empty record for empty array', () => {
    expect(parseGroqBadges([])).toEqual({})
  })
})
