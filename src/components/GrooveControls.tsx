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

const HINTS: Record<ViradasMode, string> = {
  off:     'Padrão reto, sem síncope.',
  antecip: 'O próximo acorde entra meio tempo antes — o empurrão clássico.',
  full:    'Antecipação + ghost notes + virada no fim + humanização.',
}

export function GrooveControls({ swing, viradas, onSwing, onViradas }: Props) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap gap-8">

        {/* Viradas */}
        <div className="flex-1 min-w-[220px]">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            Viradas
          </p>
          <div className="flex gap-2 flex-wrap">
            {(['off', 'antecip', 'full'] as ViradasMode[]).map(v => (
              <button
                key={v}
                onClick={() => onViradas(v)}
                className={`font-mono text-xs rounded-xl px-4 py-2.5 transition-all ${
                  viradas === v ? 'btn-primary' : 'btn-neumorphic'
                }`}
                style={viradas !== v ? { color: 'var(--color-ink)' } : {}}
              >
                {VIRADAS_LABEL[v]}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {HINTS[viradas]}
          </p>
        </div>

        {/* Swing */}
        <div className="flex-1 min-w-[220px]">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            Swing —{' '}
            <span style={{ color: 'var(--color-primary)' }}>{swing}%</span>{' '}
            <span style={{ color: 'var(--color-muted)', opacity: 0.6 }}>({SWING_LABEL(swing)})</span>
          </p>
          <input
            type="range"
            min="50"
            max="66"
            value={swing}
            onChange={e => onSwing(Number(e.target.value))}
          />
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Atrasa os contratempos. 58–62% é o sweet spot do House.
          </p>
        </div>

      </div>
    </div>
  )
}
