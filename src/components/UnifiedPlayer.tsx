import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TrackRow } from './TrackRow'
import { genKickEvents, kickStepsForGrid } from '../core/kick-pattern'
import { playUnified, stopUnified, initAudio, getTransportSeconds, getLoopDuration } from '../audio/player'
import { reVoice } from '../core/reharmonizer'
import { NOTE_NAMES } from '../core/parser'
import type { MidiEvent, ParsedChord, GenreDefinition, Timbre, TrackId, Extension } from '../types'
import { TPQ } from '../core/groove'

interface Props {
  pianoEvents: MidiEvent[]
  bassEvents: MidiEvent[]
  bpm: number
  genre: GenreDefinition
  genreName: string
  chords: ParsedChord[]
  ext: Extension
}

function midiNoteName(midi: number): string {
  const oct = Math.floor(midi / 12) - 1
  return NOTE_NAMES[midi % 12]! + oct
}

const TRACK_COLORS: Record<TrackId, string> = {
  kick:   '#e8c87a',
  chords: '#7ad1a8',
  bass:   '#8ab4f0',
}

const BAR = 4 * TPQ
const S16 = TPQ / 4

function eventsToSteps(events: MidiEvent[], bar: number): number[] {
  const steps = new Set<number>()
  const barStart = bar * BAR
  const barEnd = barStart + BAR
  events.forEach(e => {
    if (e.tick >= barStart && e.tick < barEnd) {
      const step = Math.round((e.tick - barStart) / S16)
      if (step >= 0 && step < 16) steps.add(step)
    }
  })
  return Array.from(steps)
}

export function UnifiedPlayer({ pianoEvents, bassEvents, bpm, genre, genreName, chords, ext }: Props) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [muted, setMuted] = useState<Set<TrackId>>(new Set())
  const [solo, setSolo] = useState<TrackId | null>(null)
  const [timbre, setTimbre] = useState<Timbre>('piano')
  const [hasUpdates, setHasUpdates] = useState(false)

  const numBars = Math.max(chords.length, 1)
  const slug = genreName.toLowerCase().replace(/\s+/g, '')

  const kickEvents = useMemo(
    () => genKickEvents(genreName, numBars),
    [genreName, numBars],
  )

  const kickSteps = useMemo(() => kickStepsForGrid(genreName), [genreName])
  const chordsSteps = useMemo(() => eventsToSteps(pianoEvents, 0), [pianoEvents])
  const bassSteps = useMemo(() => eventsToSteps(bassEvents, 0), [bassEvents])

  const playingRef = useRef(false)
  const loopRef = useRef(loop)
  loopRef.current = loop
  const totalSecsRef = useRef(0)

  // Detecta mudança de eventos (extensão, gênero, acordes) — para o player e sinaliza atualização
  const prevPianoRef = useRef(pianoEvents)
  const prevBassRef  = useRef(bassEvents)
  useEffect(() => {
    const changed = prevPianoRef.current !== pianoEvents || prevBassRef.current !== bassEvents
    prevPianoRef.current = pianoEvents
    prevBassRef.current  = bassEvents
    if (!changed) return
    if (playingRef.current) {
      stopUnified()
      playingRef.current = false
      setPlaying(false)
    }
    setHasUpdates(true)
  }, [pianoEvents, bassEvents])

  const stateRef = useRef({ muted, solo, timbre, kickEvents, pianoEvents, bassEvents, bpm })
  stateRef.current = { muted, solo, timbre, kickEvents, pianoEvents, bassEvents, bpm }

  // rAF para playhead — usa Tone.Transport.seconds (fonte de verdade atômica)
  // Em modo loop, Transport.seconds reinicia em loopStart, então o progresso
  // já é natural — sem precisar de módulo manual.
  useEffect(() => {
    if (!playing) { setProgress(0); return }
    let id: number
    const tick = () => {
      const total = totalSecsRef.current
      if (total > 0) {
        const loopDur = getLoopDuration()
        const elapsed = getTransportSeconds()
        // Se loopando, Transport.seconds reinicia em 0 automaticamente
        const pos = loopDur !== null ? elapsed % loopDur : elapsed
        setProgress(Math.min(pos / total, 1))
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing])

  const toggleMute = (id: TrackId) => {
    setMuted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSolo = (id: TrackId) => {
    setSolo(prev => prev === id ? null : id)
  }

  const handlePlay = async () => {
    if (playingRef.current) {
      stopUnified()
      playingRef.current = false
      setPlaying(false)
      return
    }
    if (!pianoEvents.length && !bassEvents.length) return

    // Inicia AudioContext no handler de clique (obrigatório pelo browser)
    await initAudio()
    // Guard: outro clique pode ter acontecido durante o await
    if (playingRef.current) return

    const s = stateRef.current
    const secsPerTick = 60 / s.bpm / TPQ
    const allEvents = [...s.kickEvents, ...s.pianoEvents, ...s.bassEvents]
    totalSecsRef.current = allEvents.reduce((max, e) => Math.max(max, e.tick + e.duration), 0) * secsPerTick

    setHasUpdates(false)
    playingRef.current = true
    setPlaying(true)

    playUnified({
      kickEvents: s.kickEvents,
      pianoEvents: s.pianoEvents,
      bassEvents: s.bassEvents,
      bpm: s.bpm,
      tpq: TPQ,
      muted: s.muted,
      solo: s.solo,
      timbre: s.timbre,
      loop: loopRef.current,
      onEnd: () => {
        playingRef.current = false
        setPlaying(false)
      },
    })
  }

  if (!chords.length) return null

  return (
    <div className="card p-6 space-y-4">
      {/* Título */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[3px]" style={{ color: 'var(--color-muted)' }}>05.5</span>
        <span className="font-sans font-bold text-lg" style={{ color: 'var(--color-ink)' }}>Remix Preview</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handlePlay}
          className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all"
          style={hasUpdates && !playing ? { boxShadow: `0 0 0 2px var(--color-primary), var(--shadow-btn)` } : {}}
          title={hasUpdates && !playing ? 'Progressão atualizada — clique para ouvir' : undefined}
        >
          {playing ? '■' : hasUpdates ? '↻' : '▶'}
          {' '}
          {playing ? 'Stop' : 'Play'}
        </button>

        {hasUpdates && !playing && (
          <span className="text-xs animate-pulse" style={{ color: 'var(--color-primary)' }}>
            Progressão atualizada
          </span>
        )}

        {/* Loop toggle */}
        <button
          onClick={() => setLoop(v => !v)}
          className="font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          style={{
            background: loop ? 'rgba(138,180,240,0.15)' : 'var(--color-border)',
            color: loop ? '#8ab4f0' : 'var(--color-muted)',
            border: loop ? '1px solid #8ab4f0' : '1px solid transparent',
          }}
          title="Loop"
        >
          ⟳ Loop
        </button>

        <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
          {bpm} BPM · {numBars} {numBars === 1 ? 'compasso' : 'compassos'}
        </span>
      </div>

      {/* Container das trilhas com playhead sobreposto */}
      <div className="relative overflow-hidden rounded-lg">
        {playing && (
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{
              left: `${progress * 100}%`,
              width: 2,
              background: 'var(--color-primary)',
              opacity: 0.8,
              boxShadow: '0 0 6px var(--color-primary)',
            }}
          />
        )}
        <div className="space-y-1 divide-y" style={{ borderColor: 'var(--color-border)' }}>
          <TrackRow
            id="kick"
            label={t('player.kick')}
            color={TRACK_COLORS.kick}
            muted={muted.has('kick')}
            solo={solo === 'kick'}
            onMute={() => toggleMute('kick')}
            onSolo={() => toggleSolo('kick')}
            activeSteps={kickSteps}
          />
          <TrackRow
            id="chords"
            label={t('player.chords')}
            color={TRACK_COLORS.chords}
            muted={muted.has('chords')}
            solo={solo === 'chords'}
            onMute={() => toggleMute('chords')}
            onSolo={() => toggleSolo('chords')}
            activeSteps={chordsSteps}
            timbre={timbre}
            onTimbreChange={setTimbre}
            events={pianoEvents}
            bpm={bpm}
            exportName={slug}
          />
          <TrackRow
            id="bass"
            label={t('player.bass')}
            color={TRACK_COLORS.bass}
            muted={muted.has('bass')}
            solo={solo === 'bass'}
            onMute={() => toggleMute('bass')}
            onSolo={() => toggleSolo('bass')}
            activeSteps={bassSteps}
            events={bassEvents}
            bpm={bpm}
            exportName={slug}
          />
        </div>
      </div>

      {/* Acordeão — voicings por acorde */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
          style={{
            background: expanded ? 'rgba(138,180,240,0.07)' : 'var(--color-bg)',
            color: 'var(--color-muted)',
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[3px]">
            Voicings · {chords.length} acorde{chords.length !== 1 ? 's' : ''}
          </span>
          <span
            className="text-xs transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
          >
            ▾
          </span>
        </button>

        {expanded && (
          <div
            className="px-4 pb-4 pt-2 grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              background: 'var(--color-bg)',
            }}
          >
            {chords.map((chord, i) => {
              const voiced = reVoice(chord.intervals, ext)
              const notes = voiced.map(interval =>
                midiNoteName(genre.pianoBase + chord.root + interval)
              )
              return (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2.5 space-y-2"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="font-mono text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                    {chord.tok}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {notes.map((n, j) => (
                      <span
                        key={j}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: j === 0
                            ? 'rgba(138,180,240,0.25)'
                            : 'rgba(138,180,240,0.08)',
                          color: j === 0
                            ? '#8ab4f0'
                            : 'var(--color-muted)',
                          border: j === 0
                            ? '1px solid rgba(138,180,240,0.4)'
                            : '1px solid var(--color-border)',
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="font-mono text-[9px]" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>
                    {voiced.length} nota{voiced.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
