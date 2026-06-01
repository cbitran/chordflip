import type { AISession, ChordBadgeData } from '../types'

export function sessionIsEmpty(session: AISession): boolean {
  return session.song === null && session.chords.length === 0
}

export function parseGroqBadges(raw: ChordBadgeData[]): Record<string, ChordBadgeData> {
  return raw.reduce((acc, b) => ({ ...acc, [b.chord]: b }), {} as Record<string, ChordBadgeData>)
}
