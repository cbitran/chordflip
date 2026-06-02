import { zipSync } from 'fflate'
import { trackBytes, midiFile, downloadMidi } from '../core/midi-writer'
import { genEvents } from '../core/groove'
import type { ParsedChord, Extension, ViradasMode, GenreDefinition } from '../types'
import { EXT_LABEL, VIRADAS_LABEL } from '../genres'

interface Props {
  chords: ParsedChord[]
  ext: Extension
  genre: GenreDefinition
  genreName: string
  bpm: number
  swing: number
  viradas: ViradasMode
  sectionName: string
  songName?: string
  playing: boolean
  onPlay: () => void
}

export function ExportButtons({
  chords, ext, genre, genreName, bpm, swing, viradas,
  sectionName, songName, playing, onPlay,
}: Props) {
  if (!chords.length) return (
    <div className="card p-6">
      <p className="font-mono text-sm" style={{ color: 'var(--color-muted)' }}>
        Digite acordes válidos para habilitar o preview e o export.
      </p>
    </div>
  )

  const base = songName
    ? `${songName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${genreName.toLowerCase().replace(/\s+/g, '')}`
    : `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${genreName.toLowerCase().replace(/\s+/g, '')}`

  function buildMidis() {
    const { pe, be } = genEvents(chords, ext, genre, swing / 100, viradas)
    return {
      full: midiFile([trackBytes([], bpm, 'Tempo'), trackBytes(pe, null, 'Piano'), trackBytes(be, null, 'Bass')]),
      piano: midiFile([trackBytes(pe, bpm, 'Piano')]),
      bass: midiFile([trackBytes(be, bpm, 'Bass')]),
    }
  }

  function doDownload(which: 'full' | 'piano' | 'bass') {
    const midis = buildMidis()
    downloadMidi(midis[which], `${base}-${which}.mid`)
  }

  function doDownloadAll() {
    const midis = buildMidis()
    const zipped = zipSync({
      [`${base}-full.mid`]: midis.full,
      [`${base}-piano.mid`]: midis.piano,
      [`${base}-bass.mid`]: midis.bass,
    })
    const url = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-midi.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onPlay}
          className="btn-primary px-6 py-3 text-sm font-semibold rounded-xl flex items-center gap-2"
        >
          <span>{playing ? '■' : '▶'}</span>
          {playing ? 'Parar' : 'Ouvir groove'}
        </button>

        <button
          onClick={doDownloadAll}
          className="btn-neumorphic px-5 py-3 font-mono text-xs rounded-xl flex items-center gap-2"
          style={{ color: 'var(--color-primary)' }}
        >
          ⬇ Baixar todos (.zip)
        </button>

        <button
          onClick={() => doDownload('full')}
          className="btn-neumorphic px-5 py-3 font-mono text-xs rounded-xl"
          style={{ color: 'var(--color-muted)' }}
        >
          ⬇ MIDI completo
        </button>

        <button
          onClick={() => doDownload('piano')}
          className="btn-neumorphic px-4 py-3 font-mono text-xs rounded-xl"
          style={{ color: 'var(--color-muted)' }}
        >
          ⬇ piano
        </button>

        <button
          onClick={() => doDownload('bass')}
          className="btn-neumorphic px-4 py-3 font-mono text-xs rounded-xl"
          style={{ color: 'var(--color-muted)' }}
        >
          ⬇ bass
        </button>
      </div>

      <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
        {genreName} · {EXT_LABEL[ext]} · {bpm} BPM · swing {swing}% · {VIRADAS_LABEL[viradas]} · {chords.length} compasso(s)
      </p>
    </div>
  )
}
