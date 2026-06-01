import type { MidiEvent } from '../types'
import { TPQ } from '../core/groove'

interface Props {
  pianoEvents: MidiEvent[]
  bassEvents: MidiEvent[]
  bars: number
  bpm: number
}

const STEPS = 16
const S16 = TPQ / 4
const BAR = 4 * TPQ

function eventToStep(tick: number, bar: number): number {
  return Math.round((tick - bar * BAR) / S16)
}

type CellType = 'piano' | 'bass' | 'anticipation' | 'fill' | 'sub' | null

function buildGrid(
  pianoEvents: MidiEvent[],
  bassEvents: MidiEvent[],
  bars: number,
): CellType[][] {
  // grid[row][step] — 0=piano, 1=bass
  const grid: CellType[][] = Array.from({ length: bars * 2 }, () =>
    Array(STEPS).fill(null),
  )

  pianoEvents.forEach(e => {
    const bar = Math.floor(e.tick / BAR)
    const step = eventToStep(e.tick, bar)
    if (bar < bars && step >= 0 && step < STEPS) {
      const row = bar * 2
      const type: CellType = step === 14 ? 'anticipation' : step >= 12 ? 'fill' : 'piano'
      if (!grid[row]![step]) grid[row]![step] = type
    }
  })

  bassEvents.forEach(e => {
    const bar = Math.floor(e.tick / BAR)
    const step = eventToStep(e.tick, bar)
    if (bar < bars && step >= 0 && step < STEPS) {
      const row = bar * 2 + 1
      const type: CellType = e.note < 36 ? 'sub' : step === 14 ? 'anticipation' : 'bass'
      if (!grid[row]![step]) grid[row]![step] = type
    }
  })

  return grid
}

const CELL_COLORS: Record<NonNullable<CellType>, string> = {
  piano: 'bg-major/70',
  bass: 'bg-minor/70',
  anticipation: 'bg-accent/80',
  fill: 'bg-accent/40',
  sub: 'bg-dim/60',
}

export function StepGrid({ pianoEvents, bassEvents, bars }: Props) {
  const grid = buildGrid(pianoEvents, bassEvents, bars)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Beat markers */}
        <div className="flex mb-1 ml-12">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 4 === 0 && (
                <span className="font-mono text-[9px] text-muted">{i / 4 + 1}</span>
              )}
            </div>
          ))}
        </div>

        {Array.from({ length: bars }, (_, bar) => (
          <div key={bar} className="mb-2">
            {/* Piano row */}
            <div className="flex items-center mb-0.5">
              <span className="font-mono text-[10px] text-muted w-12 shrink-0">
                C{bar + 1} P
              </span>
              {Array.from({ length: STEPS }, (_, step) => {
                const cell = grid[bar * 2]![step]
                return (
                  <div
                    key={step}
                    className={`flex-1 h-4 mx-px rounded-sm ${
                      step % 4 === 0 ? 'border-l border-white/10' : ''
                    } ${cell ? CELL_COLORS[cell] : 'bg-white/5'}`}
                  />
                )
              })}
            </div>
            {/* Bass row */}
            <div className="flex items-center">
              <span className="font-mono text-[10px] text-muted w-12 shrink-0">
                C{bar + 1} B
              </span>
              {Array.from({ length: STEPS }, (_, step) => {
                const cell = grid[bar * 2 + 1]![step]
                return (
                  <div
                    key={step}
                    className={`flex-1 h-4 mx-px rounded-sm ${
                      step % 4 === 0 ? 'border-l border-white/10' : ''
                    } ${cell ? CELL_COLORS[cell] : 'bg-white/5'}`}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(CELL_COLORS).map(([k, cls]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${cls}`} />
              <span className="font-mono text-[10px] text-muted capitalize">{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
