import { trackBytes, midiFile, downloadMidi } from '../core/midi-writer'
import { genEvents } from '../core/groove'
import type { ParsedChord, Extension, ViradasMode, GenreDefinition } from '../types'

interface Props {
  chords: ParsedChord[]
  ext: Extension
  genre: GenreDefinition
  genreName: string
  bpm: number
  swing: number
  viradas: ViradasMode
  sectionName: string
  playing: boolean
  onPlay: () => void
}

export function ExportButtons({
  chords, ext, genre, genreName, bpm, swing, viradas,
  sectionName, playing, onPlay,
}: Props) {
  if (!chords.length) return null

  const slug = `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${genreName.toLowerCase().replace(/\s+/g, '')}`

  function doDownload(which: 'full' | 'piano' | 'bass') {
    const { pe, be } = genEvents(chords, ext, genre, swing / 100, viradas)
    if (which === 'full') {
      downloadMidi(
        midiFile([
          trackBytes([], bpm, 'Tempo'),
          trackBytes(pe, null, 'Piano'),
          trackBytes(be, null, 'Bass'),
        ]),
        `${slug}-full.mid`,
      )
    } else if (which === 'piano') {
      downloadMidi(midiFile([trackBytes(pe, bpm, 'Piano')]), `${slug}-piano.mid`)
    } else {
      downloadMidi(midiFile([trackBytes(be, bpm, 'Bass')]), `${slug}-bass.mid`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onPlay}
          className="bg-good text-bg border border-good rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:opacity-90"
        >
          {playing ? '■ Parar' : '▶ Ouvir'}
        </button>
        <button
          onClick={() => doDownload('full')}
          className="bg-transparent text-accent border border-accent rounded-xl px-4 py-3 font-mono text-xs transition-all hover:bg-accent/10"
        >
          ⬇ MIDI completo
        </button>
        <button
          onClick={() => doDownload('piano')}
          className="bg-transparent text-muted border border-white/12 rounded-xl px-4 py-3 font-mono text-xs transition-all hover:border-accent hover:text-ink"
        >
          ⬇ piano
        </button>
        <button
          onClick={() => doDownload('bass')}
          className="bg-transparent text-muted border border-white/12 rounded-xl px-4 py-3 font-mono text-xs transition-all hover:border-accent hover:text-ink"
        >
          ⬇ bass
        </button>
      </div>
      <p className="font-mono text-xs text-muted">
        {genreName} · {bpm} BPM · swing {swing}% · {chords.length} compasso(s)
      </p>
    </div>
  )
}
