import { getSkeletonsForGenre, type ProgressionSkeleton } from '../lib/progressions'
import { nameChord, reVoice } from '../core/reharmonizer'
import type { Extension, ParsedChord } from '../types'

interface Props {
  tonic: number | null
  genreName: string
  ext: Extension
  onSelect: (chords: ParsedChord[], skeleton: ProgressionSkeleton) => void
  selectedId: string | null
}

function transposeToKey(skeleton: ProgressionSkeleton, tonic: number, ext: Extension) {
  return skeleton.degrees.map((deg, i) => {
    const root = (tonic + deg) % 12
    const qualStr = skeleton.qualities[i] ?? ''

    const QUALITY_MAP: Record<string, number[]> = {
      maj: [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], 'maj7': [0, 4, 7, 11],
      m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], 'm7b5': [0, 3, 6, 10],
    }
    const baseIntervals = QUALITY_MAP[qualStr] ?? [0, 4, 7]
    const reharmonized = reVoice(baseIntervals, ext)
    const name = nameChord(root, reharmonized)

    return { root, intervals: baseIntervals, reharmonizedIntervals: reharmonized, tok: name, ok: true, name }
  })
}

export function ProgressionGallery({ tonic, genreName, ext, onSelect, selectedId }: Props) {
  const skeletons = getSkeletonsForGenre(genreName)

  if (tonic === null) {
    return (
      <div className="bg-panel border border-white/8 rounded-xl p-5 text-center">
        <p className="text-muted text-sm font-mono">
          Digite acordes na seção 01 para ver progressões sugeridas
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skeletons.map(sk => {
        const chords = transposeToKey(sk, tonic, ext)
        const isSelected = selectedId === sk.id

        return (
          <button
            key={sk.id}
            onClick={() => onSelect(chords, sk)}
            className={`text-left p-4 rounded-xl border transition-all ${
              isSelected
                ? 'bg-accent/10 border-accent'
                : 'bg-panel border-white/8 hover:border-accent/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-xs text-accent font-medium">{sk.name}</span>
              {isSelected && (
                <span className="font-mono text-[10px] text-accent bg-accent/20 px-2 py-0.5 rounded">
                  selecionada
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {chords.map((c, i) => (
                <span key={i} className="font-mono text-sm font-bold text-ink">
                  {c.name}{i < chords.length - 1 && <span className="text-muted mx-1">–</span>}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted leading-relaxed">{sk.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {sk.tags.map(tag => (
                <span key={tag} className="font-mono text-[10px] text-muted/60 bg-white/5 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export { transposeToKey }
export type { ProgressionSkeleton }
