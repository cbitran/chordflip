import { VIRADAS_LABEL } from '../genres'
import type { ViradasMode } from '../types'

interface Props {
  swing: number
  viradas: ViradasMode
  onSwing: (v: number) => void
  onViradas: (v: ViradasMode) => void
}

const SWING_LABEL = (v: number) => {
  if (v <= 51) return 'reto'
  if (v < 58) return 'leve'
  if (v < 63) return 'House'
  return 'pesado'
}

const VIRADAS_HINT: Record<ViradasMode, string> = {
  off: 'Padrão reto, sem síncope.',
  antecip: 'O próximo acorde entra meio tempo antes — o empurrão clássico.',
  full: 'Antecipação + ghost notes + virada no fim + humanização.',
}

export function GrooveControls({ swing, viradas, onSwing, onViradas }: Props) {
  return (
    <div className="flex flex-wrap gap-7 bg-panel border border-white/8 rounded-xl p-5">
      <div className="flex-1 min-w-[240px]">
        <div className="font-mono text-[11px] text-muted uppercase tracking-widest mb-3">
          Viradas
        </div>
        <div className="flex gap-2">
          {(['off', 'antecip', 'full'] as ViradasMode[]).map(v => (
            <button
              key={v}
              onClick={() => onViradas(v)}
              className={`font-mono text-xs rounded-lg px-3 py-2 border transition-all ${
                viradas === v
                  ? 'bg-accent/12 border-accent text-accent'
                  : 'bg-bg text-ink border-white/10 hover:border-accent'
              }`}
            >
              {VIRADAS_LABEL[v]}
            </button>
          ))}
        </div>
        <p className="text-muted text-xs mt-3 leading-relaxed">{VIRADAS_HINT[viradas]}</p>
      </div>

      <div className="flex-1 min-w-[220px]">
        <div className="font-mono text-[11px] text-muted uppercase tracking-widest mb-3">
          Swing —{' '}
          <span className="text-accent">{swing}%</span>{' '}
          <span className="text-muted/60">({SWING_LABEL(swing)})</span>
        </div>
        <input
          type="range"
          min="50"
          max="66"
          value={swing}
          onChange={e => onSwing(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <p className="text-muted text-xs mt-3 leading-relaxed">
          Atrasa os contratempos. 58–62% é o sweet spot do House.
        </p>
      </div>
    </div>
  )
}
