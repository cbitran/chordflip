import { GENRES, GENRE_NAMES, EXT_LABEL } from '../genres'
import type { Extension } from '../types'

interface Props {
  genre: string
  ext: Extension
  bpm: number
  onGenre: (g: string) => void
  onExt: (e: Extension) => void
  onBpm: (b: number) => void
}

export function GenreSelector({ genre, ext, bpm, onGenre, onExt, onBpm }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {GENRE_NAMES.map(g => (
          <button
            key={g}
            onClick={() => onGenre(g)}
            className={`flex flex-col gap-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all border ${
              genre === g
                ? 'bg-accent text-bg border-accent'
                : 'bg-panel text-ink border-white/10 hover:border-accent'
            }`}
          >
            {g}
            <span className="font-mono text-[10px] opacity-70 font-normal">
              {GENRES[g]?.bpm} BPM
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-muted uppercase tracking-widest">
          Extensão:
        </span>
        {(['tri', '7', '9', '11'] as Extension[]).map(x => (
          <button
            key={x}
            onClick={() => onExt(x)}
            className={`font-mono text-xs rounded-lg px-3 py-2 border transition-all ${
              ext === x
                ? 'bg-accent/12 border-accent text-accent'
                : 'bg-panel text-ink border-white/10 hover:border-accent'
            }`}
          >
            {EXT_LABEL[x]}
          </button>
        ))}

        <span className="font-mono text-[11px] text-muted uppercase tracking-widest ml-4">
          BPM:
        </span>
        <input
          type="number"
          value={bpm}
          min={50}
          max={200}
          onChange={e => onBpm(Math.max(50, Math.min(200, Number(e.target.value) || 120)))}
          className="w-16 bg-panel text-ink border border-white/10 rounded-lg px-2 py-2 font-mono text-sm focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  )
}
