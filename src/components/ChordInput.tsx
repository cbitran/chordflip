import type { ReharmChord } from '../types'
import { classifyChord } from '../core/reharmonizer'

interface Props {
  value: string
  onChange: (v: string) => void
  reharm: ReharmChord[]
  bad: string[]
}

const CHORD_COLOR: Record<string, string> = {
  major: 'text-major',
  minor: 'text-minor',
  dim: 'text-dim',
  aug: 'text-accent',
}

export function ChordInput({ value, onChange, reharm, bad }: Props) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder="Ex: F Am Bb C   ou   Fmaj7 Am7 Bbmaj7 C7"
        className="w-full bg-panel text-ink border border-white/10 rounded-xl px-4 py-3 font-mono text-base resize-y focus:outline-none focus:border-accent transition-colors placeholder-muted"
        spellCheck={false}
      />
      <div className="flex flex-wrap gap-2 mt-3">
        {reharm.map((c, i) => {
          const kind = classifyChord(c.root, c.reharmonizedIntervals)
          return (
            <span
              key={i}
              className="font-mono text-xs bg-panel border border-white/8 rounded-lg px-3 py-1.5"
            >
              <span className="text-muted">{c.tok}</span>
              <span className="text-muted mx-1">→</span>
              <span className={`font-bold ${CHORD_COLOR[kind] ?? 'text-ink'}`}>{c.name}</span>
            </span>
          )
        })}
        {bad.map((b, i) => (
          <span key={i} className="font-mono text-xs bg-panel border border-white/8 rounded-lg px-3 py-1.5 opacity-40">
            {b}?
          </span>
        ))}
        {reharm.length === 0 && bad.length === 0 && (
          <span className="text-muted text-sm font-mono">Digite acordes válidos…</span>
        )}
      </div>
    </div>
  )
}
