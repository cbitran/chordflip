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

type CellType = 'piano' | 'bass' | 'anticipation' | 'fill' | 'sub' | null

const CELL_STYLES: Record<NonNullable<CellType>, { bg: string; label: string }> = {
  piano:        { bg: '#7ad1a8', label: 'piano' },
  bass:         { bg: '#8ab4f0', label: 'bass' },
  anticipation: { bg: 'var(--color-primary)', label: 'antecip' },
  fill:         { bg: 'rgba(232,200,122,0.5)', label: 'fill' },
  sub:          { bg: '#e88a8a', label: 'sub' },
}

function buildGrid(
  pianoEvents: MidiEvent[],
  bassEvents: MidiEvent[],
  bars: number,
): CellType[][] {
  const grid: CellType[][] = Array.from({ length: bars * 2 }, () => Array(STEPS).fill(null))

  pianoEvents.forEach(e => {
    const bar = Math.floor(e.tick / BAR)
    const step = Math.round((e.tick - bar * BAR) / S16)
    if (bar < bars && step >= 0 && step < STEPS && !grid[bar * 2]![step]) {
      grid[bar * 2]![step] = step === 14 ? 'anticipation' : step >= 12 ? 'fill' : 'piano'
    }
  })

  bassEvents.forEach(e => {
    const bar = Math.floor(e.tick / BAR)
    const step = Math.round((e.tick - bar * BAR) / S16)
    if (bar < bars && step >= 0 && step < STEPS && !grid[bar * 2 + 1]![step]) {
      grid[bar * 2 + 1]![step] = e.note < 36 ? 'sub' : step === 14 ? 'anticipation' : 'bass'
    }
  })

  return grid
}

export function StepGrid({ pianoEvents, bassEvents, bars }: Props) {
  const grid = buildGrid(pianoEvents, bassEvents, bars)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 480 }}>
        {/* Beat labels */}
        <div className="flex mb-2 ml-14">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className="flex-1 text-center">
              {i % 4 === 0 && (
                <span className="font-mono text-[9px]" style={{ color: 'var(--color-muted)' }}>
                  {i / 4 + 1}
                </span>
              )}
            </div>
          ))}
        </div>

        {Array.from({ length: bars }, (_, bar) => (
          <div key={bar} className="mb-2">
            {[0, 1].map(rowOffset => {
              const label = rowOffset === 0 ? 'Piano' : 'Bass'
              return (
                <div key={rowOffset} className="flex items-center mb-0.5">
                  <span
                    className="font-mono text-[10px] w-14 shrink-0"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    C{bar + 1} {label[0]}
                  </span>
                  {Array.from({ length: STEPS }, (_, step) => {
                    const cell = grid[bar * 2 + rowOffset]![step]
                    const style = cell ? CELL_STYLES[cell] : null
                    return (
                      <div
                        key={step}
                        className="flex-1 h-4 mx-px rounded-sm transition-all"
                        style={{
                          background: style ? style.bg : 'var(--color-border)',
                          opacity: style ? 0.85 : 0.4,
                          borderLeft: step % 4 === 0 ? '1px solid rgba(128,128,128,0.2)' : undefined,
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(CELL_STYLES).map(([k, { bg, label }]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: bg }} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
