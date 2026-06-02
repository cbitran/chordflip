import type { MidiEvent, Extension, ViradasMode, GenreDefinition, ParsedChord } from '../types'
import { reVoice } from './reharmonizer'

const TPQ = 480
const BAR = 4 * TPQ
const S16 = TPQ / 4

function swingShift(step: number, ratio: number): number {
  if (ratio <= 0.5) return 0
  if (step % 4 === 2) return Math.round((ratio - 0.5) * TPQ)
  if (step % 2 === 1) return Math.round((ratio - 0.5) * 240)
  return 0
}

function voicedNotes(chord: ParsedChord, ext: Extension, base: number): number[] {
  return reVoice(chord.intervals, ext).map(x => base + chord.root + x)
}

// Escolhe a oitava do acorde que minimiza o movimento total a partir das notas anteriores.
// Testa deslocamentos de -12, 0 e +12 em relação à posição base.
function voiceWithLeading(chord: ParsedChord, ext: Extension, base: number, prevNotes: number[]): number[] {
  const intervals = reVoice(chord.intervals, ext)
  const root = base + chord.root

  if (prevNotes.length === 0) return intervals.map(x => root + x)

  const score = (notes: number[]) => {
    let s = 0
    const len = Math.min(notes.length, prevNotes.length)
    for (let i = 0; i < len; i++) s += Math.abs(notes[i]! - prevNotes[i]!)
    return s
  }

  const candidates = [-12, 0, 12].map(shift => intervals.map(x => root + x + shift))
  return candidates.reduce((best, cur) => score(cur) < score(best) ? cur : best)
}

function jitter(amount: number, enabled: boolean): number {
  if (!enabled) return 0
  return Math.round((Math.random() * 2 - 1) * amount)
}

export function genEvents(
  chords: ParsedChord[],
  ext: Extension,
  genre: GenreDefinition,
  swing: number,
  viradas: ViradasMode,
): { pe: MidiEvent[]; be: MidiEvent[] } {
  const pe: MidiEvent[] = []
  const be: MidiEvent[] = []
  const n = chords.length
  const humanize = viradas === 'full'

  let prevPianoNotes: number[] = []

  for (let i = 0; i < n; i++) {
    const base = i * BAR
    const cur = chords[i]!
    const nxt = chords[(i + 1) % n]!
    const isLast = i === n - 1

    // Piano steps — adiciona step 14 para antecipação
    const pSteps = [...genre.pianoSteps]
    if (viradas !== 'off' && !pSteps.includes(14)) pSteps.push(14)

    pSteps.forEach((step, k) => {
      const useNext = viradas !== 'off' && step === 14
      const ch = useNext ? nxt : cur
      const notes = voiceWithLeading(ch, ext, genre.pianoBase, prevPianoNotes)
      if (!useNext) prevPianoNotes = notes
      const t = base + step * S16 + swingShift(step, swing) + jitter(6, humanize)
      const vel = (k % 2 ? 90 : 96) + jitter(5, humanize)
      notes.forEach(nt => pe.push({ tick: t, duration: genre.pianoDur, note: nt, velocity: Math.max(1, Math.min(127, vel)) }))
    })

    // Double-hit no final de cada compasso (step 15) quando viradas ativo
    // Recria o "pickup" característico do piano house (ex: steps 14+15, 13+15)
    if (viradas !== 'off') {
      const ch = humanize && isLast ? cur : (Math.random() < 0.5 ? nxt : cur)
      const notes = voiceWithLeading(ch, ext, genre.pianoBase, prevPianoNotes)
      const t = base + 15 * S16 + swingShift(15, swing) + jitter(8, humanize)
      notes.forEach(nt => pe.push({ tick: t, duration: genre.pianoDur, note: nt, velocity: 82 + jitter(4, humanize) }))
    }

    // Virada descendente no último compasso
    if (humanize && isLast) {
      [13, 15].forEach((step, j) => {
        const notes = voicedNotes(cur, ext, genre.pianoBase)
        const t = base + step * S16 + swingShift(step, swing)
        notes.forEach(nt => pe.push({ tick: t, duration: 90, note: nt, velocity: 78 + j * 6 }))
      })
    }

    // Bass steps
    const bSteps = [...genre.bassSteps]
    if (viradas !== 'off' && !bSteps.includes(14)) bSteps.push(14)

    bSteps.forEach((step, k) => {
      const useNext = viradas !== 'off' && step === 14
      const ch = useNext ? nxt : cur
      let root = genre.bassBase + ch.root
      if (viradas !== 'off' && k % 2 === 1) root += 12
      const t = base + step * S16 + swingShift(step, swing) + jitter(5, humanize)
      const vel = (k % 2 ? 98 : 106) + jitter(5, humanize)
      be.push({ tick: t, duration: genre.bassDur, note: root, velocity: Math.max(1, Math.min(127, vel)) })
    })

    // Sub bass
    if (genre.sub) {
      be.push({ tick: base, duration: S16 * 2, note: genre.bassBase + cur.root - 12, velocity: 110 })
    }

    // Fill no último compasso
    if (humanize && isLast) {
      [12, 13, 14, 15].forEach((step, j) => {
        const t = base + step * S16 + swingShift(step, swing)
        be.push({ tick: t, duration: 100, note: genre.bassBase + cur.root + (j % 2 ? 12 : 0), velocity: 84 + j * 5 })
      })
    }
  }

  return { pe, be }
}

export { TPQ, BAR, S16 }
