import type { ReharmChord } from '../types'
import { classifyChord } from '../core/reharmonizer'

interface Props {
  value: string
  onChange: (v: string) => void
  reharm: ReharmChord[]
  bad: string[]
}

const CHORD_COLORS: Record<string, string> = {
  major: '#7ad1a8',
  minor: '#8ab4f0',
  dim:   '#e88a8a',
  aug:   'var(--color-primary)',
}

export function ChordInput({ value, onChange, reharm, bad }: Props) {
  return (
    <div className="card p-6">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder="Ex: F Am Bb C   ou   Fmaj7 Am7 Bbmaj7 C7"
        className="input-neumorphic w-full px-4 py-3 font-mono text-base resize-y placeholder:opacity-40"
        style={{ color: 'var(--color-ink)' }}
        spellCheck={false}
      />

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {reharm.map((c, i) => {
          const kind = classifyChord(c.root, c.reharmonizedIntervals)
          return (
            <span key={i} className="chip font-mono text-xs px-3 py-1.5 flex items-center gap-1.5">
              <span style={{ color: 'var(--color-muted)' }}>{c.tok}</span>
              <span style={{ color: 'var(--color-muted)' }}>→</span>
              <span className="font-bold" style={{ color: CHORD_COLORS[kind] }}>
                {c.name}
              </span>
            </span>
          )
        })}
        {bad.map((b, i) => (
          <span key={i} className="chip font-mono text-xs px-3 py-1.5 opacity-40">
            {b}?
          </span>
        ))}
        {reharm.length === 0 && bad.length === 0 && (
          <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
            Digite acordes válidos…
          </span>
        )}
      </div>
    </div>
  )
}
