import { useState, useMemo, useCallback, useEffect } from 'react'
import { zipSync } from 'fflate'
import { parseProg } from '../core/parser'
import { genEvents, TPQ } from '../core/groove'
import { genArpeggioEvents, genPadEvents, genLeadEvents } from '../core/arranger'
import { trackBytes, midiFile } from '../core/midi-writer'
import { warmupAudio, playMiniArrangement, stopMiniArrangement } from '../audio/player'
import { buildScale } from '../core/scaleUtils'
import { GENRES } from '../genres'
import { MiniPlayer } from './MiniPlayer'
import type { Extension, ParsedChord } from '../types'
import type { SongAnalysis } from './SongSearch'
import type { SimpleWizardSong } from './SimpleWizard'

interface Props {
  analysis: SongAnalysis
  song: SimpleWizardSong
  genreName: string
  bpm: number
  onAdvanced: () => void
  onBack: () => void
}

export interface SectionMarker {
  name: string
  fraction: number
}

const EXT_CONFIGS: { ext: Extension; label: string; tagline: string; color: string }[] = [
  { ext: 'tri', label: 'Clean',     tagline: 'Direto ao ponto',  color: '#7ad1a8' },
  { ext: '7',   label: 'Quente',    tagline: 'Mais corpo',       color: '#8ab4f0' },
  { ext: '9',   label: 'Rico',      tagline: 'Harmonia densa',   color: '#c084fc' },
  { ext: '11',  label: 'Completo',  tagline: 'Arranjo cheio',    color: '#f0a84a' },
]

const SECTION_PALETTE = [
  '#8ab4f0', '#7ad1a8', '#c084fc', '#f0a84a',
  '#e88a8a', '#7ec8d4', '#f0c84a', '#a88af0',
]

const MAX_BARS = 96

const SOLO_TRACKS = [
  { id: 'piano',  label: 'Piano',  desc: 'Dá a harmonia — o corpo da música' },
  { id: 'bass',   label: 'Bass',   desc: 'Dá o groove — o que faz a cabeça balançar' },
  { id: 'arpejo', label: 'Arpejo', desc: 'Dá movimento — notas que sobem e descem' },
  { id: 'pad',    label: 'Pad',    desc: 'Dá profundidade — preenche o espaço' },
  { id: 'lead',   label: 'Lead',   desc: 'Dá a melodia — a voz que guia' },
] as const

type SoloTrack = typeof SOLO_TRACKS[number]['id']

export function ResultsPage({ analysis, song, genreName, bpm, onAdvanced, onBack }: Props) {
  const [activeExt, setActiveExt] = useState<Extension | null>(null)
  const [activeProgress, setActiveProgress] = useState(0)
  const [soloPlaying, setSoloPlaying] = useState<SoloTrack | null>(null)
  const [selectedExt, setSelectedExt] = useState<Extension | null>(null)

  useEffect(() => { warmupAudio().catch(() => {}) }, [])

  const genre = GENRES[genreName] ?? GENRES['House']!

  const scale = useMemo(
    () => buildScale(analysis.key, analysis.mode),
    [analysis.key, analysis.mode],
  )

  const songSlug = useMemo(
    () =>
      `${song.title} ${song.artist}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    [song],
  )

  const fullSong = useMemo(() => {
    const rawSections = analysis.sections?.length
      ? analysis.sections
      : [{ name: 'Main', progression: analysis.progression, repeats: 2 }]

    const allChords: ParsedChord[] = []
    const rawMarkers: { name: string; barIndex: number }[] = []

    for (const sec of rawSections) {
      const { chords: secChords } = parseProg(sec.progression)
      if (!secChords.length) continue
      if (allChords.length >= MAX_BARS) break
      rawMarkers.push({ name: sec.name, barIndex: allChords.length })
      const repeats = Math.min(sec.repeats, 8)
      for (let r = 0; r < repeats; r++) {
        for (const c of secChords) {
          if (allChords.length >= MAX_BARS) break
          allChords.push(c)
        }
      }
    }

    const total = allChords.length
    const markers: SectionMarker[] = rawMarkers.map(m => ({
      name: m.name,
      fraction: total > 0 ? m.barIndex / total : 0,
    }))

    return { chords: allChords, markers, totalBars: total }
  }, [analysis])

  const sectionColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    const seen: string[] = []
    fullSong.markers.forEach(m => {
      if (!map[m.name]) {
        map[m.name] = SECTION_PALETTE[seen.length % SECTION_PALETTE.length]!
        seen.push(m.name)
      }
    })
    return map
  }, [fullSong.markers])

  const currentMarkerIdx = useMemo(() => {
    if (activeProgress <= 0 || activeExt === null) return -1
    let idx = 0
    for (let i = 0; i < fullSong.markers.length; i++) {
      if (fullSong.markers[i]!.fraction <= activeProgress) idx = i
      else break
    }
    return idx
  }, [activeProgress, activeExt, fullSong.markers])

  const handlePlay = useCallback((ext: Extension) => {
    setSoloPlaying(null)
    setActiveProgress(0)
    setActiveExt(ext)
  }, [])

  const handleStop = useCallback(() => {
    setActiveExt(null)
    setActiveProgress(0)
  }, [])

  const handleProgress = useCallback((p: number) => setActiveProgress(p), [])

  const handleSoloPlay = useCallback(async (track: SoloTrack) => {
    stopMiniArrangement()
    setActiveExt(null)
    setActiveProgress(0)
    setSoloPlaying(track)

    const { pe, be } = genEvents(fullSong.chords, '7', genre, 0.58, 'off')
    const ae  = genArpeggioEvents(fullSong.chords, '7', scale)
    const pde = genPadEvents(fullSong.chords, '7', scale)
    const le  = genLeadEvents(fullSong.chords, '7', scale)

    await playMiniArrangement({
      kickEvents:     [],
      clapEvents:     [],
      hihatEvents:    [],
      pianoEvents:    track === 'piano'  ? pe  : [],
      bassEvents:     track === 'bass'   ? be  : [],
      arpeggioEvents: track === 'arpejo' ? ae  : [],
      padEvents:      track === 'pad'    ? pde : [],
      leadEvents:     track === 'lead'   ? le  : [],
      bpm,
      tpq: TPQ,
      onEnd: () => setSoloPlaying(null),
    })
  }, [fullSong.chords, genre, scale, bpm])

  const handleSoloStop = useCallback(() => {
    stopMiniArrangement()
    setSoloPlaying(null)
  }, [])

  const handleDownloadAll = useCallback(() => {
    const extLabels: Record<Extension, string> = { tri: '3notas', '7': '4notas', '9': '5notas', '11': '6notas' }
    const files: Record<string, Uint8Array> = {}

    for (const { ext } of EXT_CONFIGS) {
      const { pe, be } = genEvents(fullSong.chords, ext, genre, 0.58, 'off')
      const ae  = genArpeggioEvents(fullSong.chords, ext, scale)
      const pde = genPadEvents(fullSong.chords, ext, scale)
      const le  = genLeadEvents(fullSong.chords, ext, scale)
      const tempo = trackBytes([], bpm, 'Tempo')
      const folder = `${songSlug}/${extLabels[ext]}`

      files[`${folder}/piano.mid`]  = new Uint8Array(midiFile([tempo, trackBytes(pe,  null, 'Piano')]))
      files[`${folder}/bass.mid`]   = new Uint8Array(midiFile([tempo, trackBytes(be,  null, 'Bass')]))
      files[`${folder}/arpejo.mid`] = new Uint8Array(midiFile([tempo, trackBytes(ae,  null, 'Arpejo')]))
      files[`${folder}/pad.mid`]    = new Uint8Array(midiFile([tempo, trackBytes(pde, null, 'Pad')]))
      files[`${folder}/lead.mid`]   = new Uint8Array(midiFile([tempo, trackBytes(le,  null, 'Lead')]))
    }

    const zipped = zipSync(files)
    const url = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${songSlug}-chordflip.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [fullSong.chords, genre, scale, bpm, songSlug])

  if (!fullSong.chords.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Não foi possível analisar a progressão.</p>
        <button onClick={onBack} className="font-mono text-xs" style={{ color: 'var(--color-primary)' }}>← Voltar</button>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="max-w-[700px] mx-auto px-6 py-10 space-y-10">

        {/* Voltar */}
        <button
          onClick={onBack}
          className="font-mono text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-muted)' }}
        >
          ← Voltar
        </button>

        {/* ── BLOCO A: O que foi criado ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            {song.cover && (
              <img src={song.cover} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            )}
            <div>
              <h2 className="font-sans text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{song.title}</h2>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {song.artist} · {genreName} · {bpm} BPM
              </p>
            </div>
          </div>

          {analysis.explanation && (
            <p
              className="text-sm leading-relaxed px-4 py-3 rounded-2xl"
              style={{ color: 'var(--color-ink)', background: 'var(--color-card)', opacity: 0.9 }}
            >
              {analysis.explanation}
            </p>
          )}
        </section>

        {/* ── BLOCO B: Ouça o arranjo completo ── */}
        <section className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Ouça o arranjo completo
          </h3>
          <MiniPlayer
            chords={fullSong.chords}
            markers={fullSong.markers}
            scale={scale}
            ext="7"
            label="Preview completo"
            tagline="todos os instrumentos"
            color="var(--color-primary)"
            genre={genre}
            genreName={genreName}
            bpm={bpm}
            isActive={activeExt === '7' && soloPlaying === null}
            onPlay={() => { setSoloPlaying(null); handlePlay('7') }}
            onStop={handleStop}
            onProgress={handleProgress}
            songSlug={songSlug}
          />

          {/* Pills de seção */}
          {fullSong.markers.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {fullSong.markers.map((m, i) => {
                const isActive = currentMarkerIdx === i
                const sColor = sectionColorMap[m.name] ?? 'var(--color-muted)'
                return (
                  <span
                    key={i}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: isActive ? `${sColor}33` : 'var(--color-card)',
                      color: isActive ? sColor : 'var(--color-muted)',
                      border: `1px solid ${isActive ? sColor : 'var(--color-border)'}`,
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {m.name}
                  </span>
                )
              })}
            </div>
          )}
        </section>

        {/* ── BLOCO C: O que compõe este remix ── */}
        <section className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            O que compõe este remix
          </h3>

          <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {SOLO_TRACKS.map(({ id, label, desc }) => {
              const isPlaying = soloPlaying === id
              return (
                <div
                  key={id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{label}</p>
                    <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                  </div>
                  <button
                    onClick={() => isPlaying ? handleSoloStop() : void handleSoloPlay(id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 text-sm"
                    style={{
                      background: isPlaying ? 'var(--color-primary)' : 'var(--color-card-hi)',
                      color: isPlaying ? '#fff' : 'var(--color-ink)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {isPlaying ? '■' : '▶'}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="font-mono text-[11px] px-1" style={{ color: 'var(--color-muted)' }}>
            ⚠ A bateria toca no preview — adicione a sua própria bateria no Ableton.
          </p>
        </section>

        {/* ── BLOCO D: Escolha sua versão ── */}
        <section className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Escolha sua versão
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {EXT_CONFIGS.map(({ ext, label, tagline, color }) => {
              const isSelected = selectedExt === ext
              const isPlaying = activeExt === ext && soloPlaying === null
              return (
                <button
                  key={ext}
                  onClick={() => {
                    setSelectedExt(ext)
                    setSoloPlaying(null)
                    handlePlay(ext)
                  }}
                  className="card p-4 text-left transition-all"
                  style={{
                    borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                    background: isSelected ? `color-mix(in srgb, ${color} 8%, var(--color-card))` : 'var(--color-card)',
                    outline: isSelected ? `1px solid ${color}55` : 'none',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-sans font-bold text-base" style={{ color: isSelected ? color : 'var(--color-ink)' }}>
                        {label}
                      </p>
                      <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{tagline}</p>
                    </div>
                    <span className="text-xs mt-1" style={{ color: isPlaying ? color : 'var(--color-muted)' }}>
                      {isPlaying ? '▶' : '○'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Player da versão selecionada */}
          {selectedExt && (
            <div className="mt-2">
              <MiniPlayer
                chords={fullSong.chords}
                markers={fullSong.markers}
                scale={scale}
                ext={selectedExt}
                label={EXT_CONFIGS.find(e => e.ext === selectedExt)?.label ?? ''}
                tagline={EXT_CONFIGS.find(e => e.ext === selectedExt)?.tagline ?? ''}
                color={EXT_CONFIGS.find(e => e.ext === selectedExt)?.color ?? 'var(--color-primary)'}
                genre={genre}
                genreName={genreName}
                bpm={bpm}
                isActive={activeExt === selectedExt && soloPlaying === null}
                onPlay={() => { setSoloPlaying(null); handlePlay(selectedExt) }}
                onStop={handleStop}
                onProgress={handleProgress}
                songSlug={songSlug}
              />
            </div>
          )}
        </section>

        {/* ── Download all ── */}
        <section className="space-y-2 pb-10">
          <button
            onClick={handleDownloadAll}
            className="w-full py-4 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{
              background: 'var(--color-card)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            ↓ Baixar todas as versões — 5 trilhas cada (.zip)
          </button>
          <p className="font-mono text-[11px] text-center" style={{ color: 'var(--color-muted)' }}>
            Piano, bass, arpejo, pad e lead em arquivos separados. Bateria não inclusa.
          </p>
          <div className="text-center pt-4">
            <button
              onClick={onAdvanced}
              className="font-mono text-xs opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-muted)' }}
            >
              → Explorar no modo avançado
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
