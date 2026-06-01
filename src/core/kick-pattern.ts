import type { MidiEvent } from '../types'

export const TPQ_KICK = 480
const BAR = 4 * TPQ_KICK
const S16 = TPQ_KICK / 4
const KICK_NOTE = 36  // C2
const KICK_DUR = 60
const KICK_VEL = 110

type KickPattern = 'four-on-floor' | 'half-time' | 'off'

const GENRE_PATTERN: Record<string, KickPattern> = {
  'House':        'four-on-floor',
  'Deep House':   'four-on-floor',
  'Gospel House': 'four-on-floor',
  'Afro House':   'four-on-floor',
  'Techno':       'four-on-floor',
  'Lo-fi':        'half-time',
  'Jazz':         'half-time',
  'Pop':          'four-on-floor',
}

const PATTERN_STEPS: Record<KickPattern, number[]> = {
  'four-on-floor': [0, 4, 8, 12],
  'half-time':     [0, 8],
  'off':           [],
}

export function genKickEvents(genreName: string, numBars: number): MidiEvent[] {
  const pattern = GENRE_PATTERN[genreName] ?? 'four-on-floor'
  const steps = PATTERN_STEPS[pattern]!
  const events: MidiEvent[] = []

  for (let bar = 0; bar < numBars; bar++) {
    const base = bar * BAR
    steps.forEach(step => {
      events.push({
        tick: base + step * S16,
        duration: KICK_DUR,
        note: KICK_NOTE,
        velocity: KICK_VEL,
      })
    })
  }

  return events
}

export function kickStepsForGrid(genreName: string): number[] {
  const pattern = GENRE_PATTERN[genreName] ?? 'four-on-floor'
  return PATTERN_STEPS[pattern]!
}
