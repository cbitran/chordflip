# Remix Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar seção "Remix Preview" com trilhas Kick + Chords + Bass, controles de mute/solo por trilha, seletor de timbre nos Chords e export MIDI individual por trilha.

**Architecture:** Novos módulos `kick-pattern.ts` e `timbres.ts` encapsulam lógica de domínio. `UnifiedPlayer` gerencia estado e orquestra `TrackRow` components. `player.ts` ganha `playUnified()` que respeita mute/solo/timbre. A seção nova se encaixa entre StepGrid e ExportButtons no `App.tsx`.

**Tech Stack:** React 18, TypeScript, Tone.js (MembraneSynth, PolySynth, MonoSynth, Reverb, Chorus, Delay), midi-writer.ts existente.

---

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Create | `src/core/kick-pattern.ts` | Gera MidiEvent[] de kick por gênero |
| Create | `src/audio/timbres.ts` | Configs Tone.js por timbre (Pad/Pluck/Lead/Piano) |
| Create | `src/components/TrackRow.tsx` | Linha de trilha: M/S + grid + timbre + export |
| Create | `src/components/UnifiedPlayer.tsx` | Container com estado e play/stop |
| Modify | `src/audio/player.ts` | Adicionar `playUnified()` e `stopUnified()` |
| Modify | `src/App.tsx` | Nova seção 05.5 com `<UnifiedPlayer />` |
| Modify | `src/i18n/pt-BR.ts` | Strings do player em PT |
| Modify | `src/i18n/en.ts` | Strings do player em EN |
| Modify | `src/i18n/es.ts` | Strings do player em ES |

---

## Task 1: Tipos e i18n

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/i18n/pt-BR.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/es.ts`

- [ ] **Step 1: Adicionar tipos em `src/types/index.ts`**

Adicionar após a última linha do arquivo:

```ts
export type Timbre = 'pad' | 'pluck' | 'lead' | 'piano'
export type TrackId = 'kick' | 'chords' | 'bass'
```

- [ ] **Step 2: Adicionar strings em `src/i18n/pt-BR.ts`**

Adicionar dentro do objeto `player:` (criar seção nova após `account:`):

```ts
  player: {
    title: 'Remix Preview',
    subtitle: 'Ouça a sugestão de arranjo, isole trilhas e exporte o MIDI para sua DAW.',
    kick: 'Kick',
    chords: 'Chords',
    bass: 'Bass',
    mute: 'M',
    solo: 'S',
    soloActive: 'SOLO',
    timbrePad: 'Pad',
    timbrePluck: 'Pluck',
    timbreLead: 'Lead',
    timbrePiano: 'Piano',
    exportMidi: '↓ MIDI',
  },
```

- [ ] **Step 3: Adicionar strings em `src/i18n/en.ts`**

```ts
  player: {
    title: 'Remix Preview',
    subtitle: 'Hear the arrangement suggestion, isolate tracks and export MIDI to your DAW.',
    kick: 'Kick',
    chords: 'Chords',
    bass: 'Bass',
    mute: 'M',
    solo: 'S',
    soloActive: 'SOLO',
    timbrePad: 'Pad',
    timbrePluck: 'Pluck',
    timbreLead: 'Lead',
    timbrePiano: 'Piano',
    exportMidi: '↓ MIDI',
  },
```

- [ ] **Step 4: Adicionar strings em `src/i18n/es.ts`**

```ts
  player: {
    title: 'Remix Preview',
    subtitle: 'Escucha la sugerencia de arreglo, aisla pistas y exporta MIDI a tu DAW.',
    kick: 'Kick',
    chords: 'Chords',
    bass: 'Bass',
    mute: 'M',
    solo: 'S',
    soloActive: 'SOLO',
    timbrePad: 'Pad',
    timbrePluck: 'Pluck',
    timbreLead: 'Lead',
    timbrePiano: 'Piano',
    exportMidi: '↓ MIDI',
  },
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/i18n/pt-BR.ts src/i18n/en.ts src/i18n/es.ts
git commit -m "feat(player): tipos Timbre/TrackId e strings i18n do Remix Preview"
```

---

## Task 2: kick-pattern.ts

**Files:**
- Create: `src/core/kick-pattern.ts`

- [ ] **Step 1: Criar `src/core/kick-pattern.ts`**

```ts
import type { MidiEvent } from '../types'

export const TPQ_KICK = 480
const BAR = 4 * TPQ_KICK
const S16 = TPQ_KICK / 4
const KICK_NOTE = 36  // C2
const KICK_DUR = 60
const KICK_VEL = 110

type KickPattern = 'four-on-floor' | 'half-time' | 'off'

const GENRE_PATTERN: Record<string, KickPattern> = {
  'House':        'four-on-floor',
  'Deep House':   'four-on-floor',
  'Gospel House': 'four-on-floor',
  'Afro House':   'four-on-floor',
  'Techno':       'four-on-floor',
  'Lo-fi':        'half-time',
  'Jazz':         'half-time',
  'Pop':          'four-on-floor',
}

const PATTERN_STEPS: Record<KickPattern, number[]> = {
  'four-on-floor': [0, 4, 8, 12],
  'half-time':     [0, 8],
  'off':           [],
}

export function genKickEvents(genreName: string, numBars: number): MidiEvent[] {
  const pattern = GENRE_PATTERN[genreName] ?? 'four-on-floor'
  const steps = PATTERN_STEPS[pattern]!
  const events: MidiEvent[] = []

  for (let bar = 0; bar < numBars; bar++) {
    const base = bar * BAR
    steps.forEach(step => {
      events.push({
        tick: base + step * S16,
        duration: KICK_DUR,
        note: KICK_NOTE,
        velocity: KICK_VEL,
      })
    })
  }

  return events
}

export function kickStepsForGrid(genreName: string): number[] {
  const pattern = GENRE_PATTERN[genreName] ?? 'four-on-floor'
  return PATTERN_STEPS[pattern]!
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/core/kick-pattern.ts
git commit -m "feat(player): gerador de padrão de kick por gênero"
```

---

## Task 3: timbres.ts

**Files:**
- Create: `src/audio/timbres.ts`

- [ ] **Step 1: Criar `src/audio/timbres.ts`**

```ts
import * as Tone from 'tone'
import type { Timbre } from '../types'

export interface TimbreConfig {
  synth: Tone.PolySynth
  cleanup: () => void
}

export function createTimbreSynth(timbre: Timbre): TimbreConfig {
  let synth: Tone.PolySynth
  let effect: Tone.Reverb | Tone.FeedbackDelay | Tone.Chorus | null = null

  switch (timbre) {
    case 'pad': {
      const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination()
      const chorus = new Tone.Chorus(3, 2.5, 0.4).connect(reverb).start()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.4, decay: 0.3, sustain: 0.8, release: 2.0 },
      }).connect(chorus)
      synth.volume.value = -10
      return {
        synth,
        cleanup: () => { synth.dispose(); chorus.dispose(); reverb.dispose() },
      }
    }
    case 'pluck': {
      const delay = new Tone.FeedbackDelay('8n', 0.2).toDestination()
      delay.wet.value = 0.15
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.3 },
      }).connect(delay)
      synth.volume.value = -8
      return {
        synth,
        cleanup: () => { synth.dispose(); delay.dispose() },
      }
    }
    case 'lead': {
      const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
      }).connect(reverb)
      synth.volume.value = -14
      return {
        synth,
        cleanup: () => { synth.dispose(); reverb.dispose() },
      }
    }
    case 'piano':
    default: {
      const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination()
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 24 } as Tone.OmniOscillatorOptions,
        envelope: { attack: 0.03, decay: 0.3, sustain: 0.4, release: 0.8 },
      }).connect(reverb)
      synth.volume.value = -13
      return {
        synth,
        cleanup: () => { synth.dispose(); reverb.dispose() },
      }
    }
  }
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/audio/timbres.ts
git commit -m "feat(player): presets de timbre Pad/Pluck/Lead/Piano para Tone.js"
```

---

## Task 4: playUnified() em player.ts

**Files:**
- Modify: `src/audio/player.ts`

- [ ] **Step 1: Adicionar imports e função `playUnified` em `src/audio/player.ts`**

Adicionar após os imports existentes:

```ts
import type { Timbre, TrackId } from '../types'
import { createTimbreSynth } from './timbres'
```

Adicionar antes de `stopAll()`:

```ts
let unifiedCleanup: (() => void) | null = null

export interface UnifiedPlayOptions {
  kickEvents: MidiEvent[]
  pianoEvents: MidiEvent[]
  bassEvents: MidiEvent[]
  bpm: number
  tpq: number
  muted: Set<TrackId>
  solo: TrackId | null
  timbre: Timbre
  onEnd: () => void
}

export async function playUnified({
  kickEvents, pianoEvents, bassEvents,
  bpm, tpq, muted, solo, timbre, onEnd,
}: UnifiedPlayOptions): Promise<void> {
  await Tone.start()
  stopUnified()

  const secsPerTick = 60 / bpm / tpq
  const now = Tone.now() + 0.1

  const isActive = (track: TrackId): boolean => {
    if (solo) return track === solo
    return !muted.has(track)
  }

  const cleanups: Array<() => void> = []

  // Kick
  if (isActive('kick') && kickEvents.length > 0) {
    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 8,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.1 },
    }).toDestination()
    kickSynth.volume.value = -4
    kickEvents.forEach(({ tick, duration }) => {
      kickSynth.triggerAttackRelease(
        'C1',
        Math.max(duration * secsPerTick, 0.05),
        now + tick * secsPerTick,
        0.9,
      )
    })
    cleanups.push(() => kickSynth.dispose())
  }

  // Chords
  if (isActive('chords') && pianoEvents.length > 0) {
    const { synth: chordSynth, cleanup } = createTimbreSynth(timbre)
    pianoEvents.forEach(({ tick, duration, note, velocity }) => {
      chordSynth.triggerAttackRelease(
        midiToNote(note),
        Math.max(duration * secsPerTick, 0.05),
        now + tick * secsPerTick,
        velocity / 127,
      )
    })
    cleanups.push(cleanup)
  }

  // Bass
  if (isActive('bass') && bassEvents.length > 0) {
    const bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 120, octaves: 2.5 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 },
    }).toDestination()
    bassSynth.volume.value = -10
    bassEvents.forEach(({ tick, duration, note, velocity }) => {
      bassSynth.triggerAttackRelease(
        midiToNote(note),
        Math.max(duration * secsPerTick, 0.05),
        now + tick * secsPerTick,
        velocity / 127,
      )
    })
    cleanups.push(() => bassSynth.dispose())
  }

  unifiedCleanup = () => cleanups.forEach(fn => fn())

  const allEvents = [...kickEvents, ...pianoEvents, ...bassEvents]
  const lastTick = allEvents.reduce((max, e) => Math.max(max, e.tick + e.duration), 0)
  const totalMs = lastTick * secsPerTick * 1000

  setTimeout(() => { stopUnified(); onEnd() }, totalMs + 300)
}

export function stopUnified(): void {
  unifiedCleanup?.()
  unifiedCleanup = null
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/audio/player.ts
git commit -m "feat(player): playUnified() com suporte a mute/solo/timbre e kick MembraneSynth"
```

---

## Task 5: TrackRow component

**Files:**
- Create: `src/components/TrackRow.tsx`

- [ ] **Step 1: Criar `src/components/TrackRow.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import type { TrackId, Timbre, MidiEvent } from '../types'
import { trackBytes, midiFile, downloadMidi } from '../core/midi-writer'

const STEPS = 16

interface TrackRowProps {
  id: TrackId
  label: string
  color: string
  muted: boolean
  solo: boolean
  onMute: () => void
  onSolo: () => void
  // Steps ativos (0-15) para colorir o grid
  activeSteps: number[]
  // Somente Chords
  timbre?: Timbre
  onTimbreChange?: (t: Timbre) => void
  // Somente Chords e Bass (não Kick)
  events?: MidiEvent[]
  bpm?: number
  exportName?: string
}

const TIMBRES: Timbre[] = ['pad', 'pluck', 'lead', 'piano']

export function TrackRow({
  id, label, color, muted, solo,
  onMute, onSolo, activeSteps,
  timbre, onTimbreChange,
  events, bpm, exportName,
}: TrackRowProps) {
  const { t } = useTranslation()

  const handleExport = () => {
    if (!events || !bpm || !exportName) return
    downloadMidi(
      midiFile([
        trackBytes([], bpm, 'Tempo'),
        trackBytes(events, null, label),
      ]),
      `${exportName}-${id}.mid`,
    )
  }

  const activeSet = new Set(activeSteps)
  const isKick = id === 'kick'
  const effectiveMuted = muted && !solo

  return (
    <div
      className="flex items-center gap-3 py-2"
      style={{ opacity: effectiveMuted ? 0.4 : 1, transition: 'opacity 0.15s' }}
    >
      {/* Label */}
      <span
        className="font-mono text-[11px] uppercase tracking-widest w-14 shrink-0 text-right"
        style={{ color: solo ? color : 'var(--color-muted)', textDecoration: effectiveMuted ? 'line-through' : 'none' }}
      >
        {label}
      </span>

      {/* Mute */}
      <button
        onClick={onMute}
        className="font-mono text-[10px] w-6 h-6 rounded flex items-center justify-center shrink-0 transition-all"
        style={{
          background: muted ? 'rgba(232,138,138,0.2)' : 'var(--color-border)',
          color: muted ? '#e88a8a' : 'var(--color-muted)',
          border: muted ? '1px solid #e88a8a' : '1px solid transparent',
        }}
        title={t('player.mute')}
      >
        M
      </button>

      {/* Solo */}
      <button
        onClick={onSolo}
        className="font-mono text-[10px] w-6 h-6 rounded flex items-center justify-center shrink-0 transition-all"
        style={{
          background: solo ? `${color}33` : 'var(--color-border)',
          color: solo ? color : 'var(--color-muted)',
          border: solo ? `1px solid ${color}` : '1px solid transparent',
        }}
        title={t('player.solo')}
      >
        S
      </button>

      {/* Timbre selector (Chords only) */}
      {timbre && onTimbreChange ? (
        <select
          value={timbre}
          onChange={e => onTimbreChange(e.target.value as Timbre)}
          className="font-mono text-[10px] px-2 py-1 rounded-lg shrink-0"
          style={{
            background: 'var(--color-card)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-border)',
          }}
        >
          {TIMBRES.map(tb => (
            <option key={tb} value={tb}>
              {t(`player.timbre${tb.charAt(0).toUpperCase() + tb.slice(1)}`)}
            </option>
          ))}
        </select>
      ) : (
        /* Spacer para alinhar o grid */
        !isKick && <div className="w-16 shrink-0" />
      )}

      {/* Step grid */}
      <div className="flex-1 flex gap-px">
        {Array.from({ length: STEPS }, (_, i) => {
          const active = activeSet.has(i)
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: isKick ? 8 : 16,
                background: active ? color : 'var(--color-border)',
                opacity: active ? (isKick ? 1 : 0.8) : 0.35,
                borderRadius: isKick && active ? '50%' : undefined,
                borderLeft: i % 4 === 0 ? '1px solid rgba(128,128,128,0.15)' : undefined,
              }}
            />
          )
        })}
      </div>

      {/* Export button (não aparece no Kick) */}
      {!isKick && events ? (
        <button
          onClick={handleExport}
          className="font-mono text-[10px] px-2 py-1 rounded-lg shrink-0 transition-colors"
          style={{
            background: 'var(--color-card)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        >
          {t('player.exportMidi')}
        </button>
      ) : (
        <div className="w-14 shrink-0" />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/TrackRow.tsx
git commit -m "feat(player): componente TrackRow com mute/solo/timbre/export"
```

---

## Task 6: UnifiedPlayer component

**Files:**
- Create: `src/components/UnifiedPlayer.tsx`

- [ ] **Step 1: Criar `src/components/UnifiedPlayer.tsx`**

```tsx
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrackRow } from './TrackRow'
import { genKickEvents, kickStepsForGrid, TPQ_KICK } from '../core/kick-pattern'
import { playUnified, stopUnified } from '../audio/player'
import type { MidiEvent, ParsedChord, Extension, ViradasMode, GenreDefinition, Timbre, TrackId } from '../types'
import { TPQ } from '../core/groove'

interface Props {
  pianoEvents: MidiEvent[]
  bassEvents: MidiEvent[]
  bpm: number
  genre: GenreDefinition
  genreName: string
  swing: number
  viradas: ViradasMode
  chords: ParsedChord[]
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

export function UnifiedPlayer({
  pianoEvents, bassEvents, bpm, genre, genreName, chords,
}: Props) {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState<Set<TrackId>>(new Set())
  const [solo, setSolo] = useState<TrackId | null>(null)
  const [timbre, setTimbre] = useState<Timbre>('piano')

  const numBars = Math.max(chords.length, 1)
  const slug = genreName.toLowerCase().replace(/\s+/g, '')

  const kickEvents = useMemo(
    () => genKickEvents(genreName, numBars),
    [genreName, numBars],
  )

  // Mostra steps do primeiro compasso no grid
  const kickSteps = useMemo(() => kickStepsForGrid(genreName), [genreName])
  const chordsSteps = useMemo(() => eventsToSteps(pianoEvents, 0), [pianoEvents])
  const bassSteps = useMemo(() => eventsToSteps(bassEvents, 0), [bassEvents])

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
    if (playing) {
      stopUnified()
      setPlaying(false)
      return
    }
    if (!pianoEvents.length && !bassEvents.length) return
    setPlaying(true)
    await playUnified({
      kickEvents,
      pianoEvents,
      bassEvents,
      bpm,
      tpq: TPQ,
      muted,
      solo,
      timbre,
      onEnd: () => setPlaying(false),
    })
  }

  if (!chords.length) return null

  return (
    <div className="card p-6 space-y-4">
      {/* Play/Stop */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlay}
          className="btn-primary px-5 py-2 text-sm font-semibold rounded-xl flex items-center gap-2"
        >
          {playing ? '■' : '▶'} {playing ? 'Stop' : 'Play'}
        </button>
        <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
          {bpm} BPM · {numBars} {numBars === 1 ? 'compasso' : 'compassos'}
        </span>
      </div>

      {/* Tracks */}
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
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/UnifiedPlayer.tsx
git commit -m "feat(player): UnifiedPlayer com estado mute/solo/timbre e play/stop"
```

---

## Task 7: Integrar no App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar import do UnifiedPlayer no topo de `src/App.tsx`**

```tsx
import { UnifiedPlayer } from './components/UnifiedPlayer'
```

- [ ] **Step 2: Adicionar string i18n da nova seção**

Em `src/i18n/pt-BR.ts`, dentro de `sections:`:
```ts
player: 'Remix Preview',
playerHint: 'Ouça a sugestão de arranjo, isole trilhas e exporte o MIDI para sua DAW.',
```

Em `src/i18n/en.ts`, dentro de `sections:`:
```ts
player: 'Remix Preview',
playerHint: 'Hear the arrangement suggestion, isolate tracks and export MIDI to your DAW.',
```

Em `src/i18n/es.ts`, dentro de `sections:`:
```ts
player: 'Remix Preview',
playerHint: 'Escucha la sugerencia de arreglo, aisla pistas y exporta MIDI a tu DAW.',
```

- [ ] **Step 3: Inserir seção no JSX do App.tsx**

Inserir ENTRE a seção `{/* 05 — Grid */}` e a seção `{/* 06 — Export */}`:

```tsx
      {/* 05.5 — Remix Preview */}
      {parsedChords.length > 0 && (
        <section id="remix-preview" className="mb-10 scroll-mt-6">
          <SectionHeader
            number="05.5"
            title={t('sections.player', 'Remix Preview')}
            subtitle={t('sections.playerHint', '')}
          />
          <UnifiedPlayer
            pianoEvents={pe}
            bassEvents={be}
            bpm={bpm}
            genre={genre}
            genreName={genreName}
            swing={swing}
            viradas={viradas}
            chords={parsedChords}
          />
        </section>
      )}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc -b --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Build de produção**

```bash
npm run build
```

Esperado: build completo sem erros.

- [ ] **Step 6: Commit e push**

```bash
git add src/App.tsx src/i18n/pt-BR.ts src/i18n/en.ts src/i18n/es.ts
git commit -m "feat(player): integra UnifiedPlayer como seção 05.5 no App"
git push origin main
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Kick como metrônomo (não exportável)
- ✅ Chords com seletor de timbre + export MIDI
- ✅ Bass com export MIDI
- ✅ Mute por trilha
- ✅ Solo por trilha (muta as outras)
- ✅ Grid visual de 16 steps
- ✅ i18n PT/EN/ES

**Checagem de tipos:**
- `Timbre` e `TrackId` definidos em Task 1, usados em Tasks 4, 5, 6 ✅
- `TPQ` importado de `src/core/groove` — verificar que é exportado lá (é: `export const TPQ = 480`)
- `TPQ_KICK` exportado de `kick-pattern.ts`, importado em `UnifiedPlayer` ✅
- `trackBytes`, `midiFile`, `downloadMidi` importados de `midi-writer` em TrackRow ✅

**Potencial issue:** `OmniOscillatorOptions` cast em timbres.ts — é o mesmo padrão do player.ts existente, então é seguro.
