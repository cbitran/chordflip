import type { InlineWizardResult } from './InlineWizard'

interface Props {
  step: number
  result: InlineWizardResult
  onNext: () => void
  onDone: () => void
}

const STEP_LABELS = [
  'Próximo — ver a sugestão →',
  'Próximo — explorar os acordes →',
  'Próximo — ouvir o preview →',
  'Entrar no studio completo →',
]

export function GuideNarration({ step, result, onNext, onDone }: Props) {
  const isLast = step === 3

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header IA */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base" style={{ color: 'var(--color-primary)' }}>✦</span>
        <span className="font-mono text-[10px] uppercase tracking-[3px]" style={{ color: 'var(--color-primary)' }}>
          AI Coach
        </span>
      </div>

      {/* Passo 0 — Contexto capturado */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            Contexto capturado. Aqui está o que vou construir com você:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {result.song && (
              <span className="chip font-mono text-xs px-3 py-1.5" style={{ color: 'var(--color-ink)' }}>
                🎵 {result.song.title} · {result.song.artist}
              </span>
            )}
            <span className="chip font-mono text-xs px-3 py-1.5" style={{ color: 'var(--color-primary)' }}>
              {result.style}
            </span>
            <span className="chip font-mono text-xs px-3 py-1.5" style={{ color: 'var(--color-muted)' }}>
              {result.bpm} BPM
            </span>
            {result.feeling.map(f => (
              <span key={f} className="chip font-mono text-xs px-3 py-1.5" style={{ color: 'var(--color-muted)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Passo 1 — Sugestão de progressão */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            Minha sugestão de progressão para {result.style} a {result.bpm} BPM:
          </p>
          <div className="flex flex-wrap gap-2">
            {result.chords.map((chord, i) => (
              <span
                key={i}
                className="px-5 py-2.5 rounded-xl text-base font-bold"
                style={{ background: 'var(--color-primary)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                {chord}
              </span>
            ))}
          </div>
          {result.explanation && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {result.explanation}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Os acordes já foram aplicados no campo abaixo. Explore outros — cada um tem sua função harmônica.
          </p>
        </div>
      )}

      {/* Passo 2 — Campo harmônico */}
      {step === 2 && (
        <div className="space-y-2">
          <p className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            Explore o campo harmônico.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Clique em qualquer acorde para adicioná-lo à progressão. Os badges{' '}
            <span>🟢</span><span>🟡</span><span>🔴</span>{' '}
            mostram o quanto cada acorde encaixa no contexto de {result.style}.
            Você pode montar sua própria variação — sem sair da zona harmônica.
          </p>
        </div>
      )}

      {/* Passo 3 — Preview */}
      {step === 3 && (
        <div className="space-y-2">
          <p className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            Ouça como vai soar.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Kick + acordes + baixo a {result.bpm} BPM. Mute ou solo as trilhas para ouvir cada camada.
            Quando estiver satisfeito, exporte os MIDIs direto para sua DAW.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="text-xs"
          style={{ color: 'var(--color-muted)', opacity: 0.6 }}
        >
          ↑ Ver do início
        </button>
        <button
          onClick={isLast ? onDone : onNext}
          className="btn-primary px-6 py-2.5 text-sm rounded-xl"
        >
          {STEP_LABELS[step]}
        </button>
      </div>
    </div>
  )
}
