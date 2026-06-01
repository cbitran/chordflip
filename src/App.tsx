import { useState, useMemo, useRef, useCallback } from 'react'
import { parseProg } from './core/parser'
import { reVoice, nameChord } from './core/reharmonizer'
import { genEvents, TPQ } from './core/groove'
import { playEvents, stopAll } from './audio/player'
import { GENRES } from './genres'
import { SectionHeader } from './components/SectionHeader'
import { ChordInput } from './components/ChordInput'
import { GenreSelector } from './components/GenreSelector'
import { GrooveControls } from './components/GrooveControls'
import { StepGrid } from './components/StepGrid'
import { ExportButtons } from './components/ExportButtons'
import { InstrumentGuide } from './components/InstrumentGuide'
import { ProgressionGallery } from './components/ProgressionGallery'
import type { Extension, ViradasMode, ReharmChord, ParsedChord } from './types'

const DEFAULT_TEXT = 'F Am Bb C'
const DEFAULT_GENRE = 'House'

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [genreName, setGenreName] = useState(DEFAULT_GENRE)
  const [extOverride, setExtOverride] = useState<Extension | null>(null)
  const [bpmOverride, setBpmOverride] = useState<number | null>(null)
  const [swing, setSwing] = useState(58)
  const [viradas, setViradas] = useState<ViradasMode>('antecip')
  const [playing, setPlaying] = useState(false)
  const [selectedSkeletonId, setSelectedSkeletonId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const genre = GENRES[genreName]!
  const ext = extOverride ?? genre.ext
  const bpm = bpmOverride ?? genre.bpm

  const { chords: parsedChords, bad } = useMemo(() => parseProg(text), [text])

  const reharm: ReharmChord[] = useMemo(
    () =>
      parsedChords.map(c => {
        const reharmonizedIntervals = reVoice(c.intervals, ext)
        return { ...c, reharmonizedIntervals, name: nameChord(c.root, reharmonizedIntervals) }
      }),
    [parsedChords, ext],
  )

  const tonic = parsedChords[0]?.root ?? null

  const { pe, be } = useMemo(() => {
    if (!parsedChords.length) return { pe: [], be: [] }
    return genEvents(parsedChords, ext, genre, swing / 100, viradas)
  }, [parsedChords, ext, genre, swing, viradas])

  const handlePlay = useCallback(async () => {
    if (!parsedChords.length) return
    if (playing) {
      stopAll()
      if (timerRef.current) clearTimeout(timerRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    await playEvents(pe, be, bpm, TPQ, () => setPlaying(false))
  }, [parsedChords, playing, pe, be, bpm])

  const handleGenreChange = (g: string) => {
    setGenreName(g)
    setExtOverride(null)
    setBpmOverride(null)
  }

  const handleGallerySelect = (chords: ParsedChord[], skeleton: { id: string }) => {
    setSelectedSkeletonId(skeleton.id)
    const newText = chords.map(c => c.tok).join(' ')
    setText(newText)
  }

  return (
    <div
      className="min-h-screen bg-bg text-ink font-sans"
      style={{
        backgroundImage: 'radial-gradient(900px 400px at 80% -10%, rgba(232,200,122,0.05), transparent)',
      }}
    >
      <div className="max-w-4xl mx-auto px-8 py-12 pb-20">

        {/* Header */}
        <header className="mb-10">
          <div className="font-mono text-[11px] text-muted tracking-[3px] mb-4 uppercase">
            Reharm Studio · Acordes → MIDI por Estilo
          </div>
          <h1 className="font-serif text-6xl font-normal leading-none tracking-tight text-ink">
            Reharm Studio
          </h1>
          <p className="text-muted text-base mt-3 max-w-xl leading-relaxed">
            Cole os acordes da música que quer remixar, escolha o estilo e o groove,
            e baixe o MIDI de piano e baixo — pronto pro Ableton.
          </p>
        </header>

        {/* Nota de contexto */}
        <div className="bg-accent/5 border border-accent/18 rounded-xl px-5 py-4 text-sm text-muted leading-relaxed mb-10">
          <strong className="text-ink">Como usar:</strong> cole os acordes que você encontrou no
          Chordify ou Ultimate Guitar. Use{' '}
          <code className="font-mono bg-white/7 px-1.5 py-0.5 rounded text-xs">C7</code> onde
          quiser dominante. O <strong className="text-ink">swing</strong> dá o balanço e as{' '}
          <strong className="text-ink">viradas</strong> antecipam a troca de acorde — é o que tira
          o som de "robô".
        </div>

        {/* 01 — Acordes */}
        <section className="mb-9">
          <SectionHeader number="01" title="Cole os acordes" />
          <ChordInput
            value={text}
            onChange={setText}
            reharm={reharm}
            bad={bad}
          />
        </section>

        {/* 02 — Estilo */}
        <section className="mb-9">
          <SectionHeader number="02" title="Estilo" />
          <GenreSelector
            genre={genreName}
            ext={ext}
            bpm={bpm}
            onGenre={handleGenreChange}
            onExt={setExtOverride}
            onBpm={setBpmOverride}
          />
        </section>

        {/* 03 — Progressões sugeridas */}
        <section className="mb-9">
          <SectionHeader number="03" title={`Progressões — ${genreName}`} />
          <p className="text-muted text-sm mb-4 leading-relaxed">
            Esqueletos harmônicos curados para {genreName}, transpostos para a tonalidade
            dos seus acordes. Clique para usar como base.
          </p>
          <ProgressionGallery
            tonic={tonic}
            genreName={genreName}
            ext={ext}
            onSelect={handleGallerySelect}
            selectedId={selectedSkeletonId}
          />
        </section>

        {/* 04 — Groove */}
        <section className="mb-9">
          <SectionHeader number="04" title="Groove" />
          <GrooveControls
            swing={swing}
            viradas={viradas}
            onSwing={setSwing}
            onViradas={v => {
              setViradas(v)
              if (v !== 'off' && swing === 50) setSwing(58)
            }}
          />
        </section>

        {/* 05 — Grid Visual */}
        {parsedChords.length > 0 && (
          <section className="mb-9">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono text-xs text-accent tracking-widest">05</span>
              <h2 className="font-serif text-2xl font-normal text-ink">Grid rítmico</h2>
              <button
                onClick={() => setShowGrid(v => !v)}
                className="font-mono text-xs text-muted hover:text-accent transition-colors ml-auto"
              >
                {showGrid ? '▲ ocultar' : '▼ mostrar'}
              </button>
            </div>
            {showGrid && (
              <div className="bg-panel border border-white/8 rounded-xl p-5">
                <StepGrid
                  pianoEvents={pe}
                  bassEvents={be}
                  bars={parsedChords.length}
                  bpm={bpm}
                />
              </div>
            )}
          </section>
        )}

        {/* 06 — Resultado e Export */}
        <section className="mb-9">
          <SectionHeader number={parsedChords.length > 0 ? '06' : '05'} title="Resultado" />
          {parsedChords.length > 0 ? (
            <ExportButtons
              chords={parsedChords}
              ext={ext}
              genre={genre}
              genreName={genreName}
              bpm={bpm}
              swing={swing}
              viradas={viradas}
              sectionName="remix"
              playing={playing}
              onPlay={handlePlay}
            />
          ) : (
            <p className="text-muted text-sm font-mono">
              Digite acordes válidos para habilitar o preview e o export.
            </p>
          )}
        </section>

        {/* 07 — Instrumentos */}
        <section>
          <SectionHeader number={parsedChords.length > 0 ? '07' : '06'} title="Instrumentos sugeridos" />
          <InstrumentGuide genreName={genreName} inst={genre.inst} />
        </section>

        <footer className="mt-14 pt-6 border-t border-white/6 text-center font-mono text-xs text-muted">
          Cole · estilo · progressão · groove · ouça · baixe o MIDI · arraste pro Ableton.
        </footer>
      </div>
    </div>
  )
}
