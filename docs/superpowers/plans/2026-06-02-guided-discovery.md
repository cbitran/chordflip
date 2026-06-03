# ChordFlip Guided Discovery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o SidebarPage pelo fluxo Wizard → Guided Discovery (Blocos A/B/C/D) com export MIDI por instrumento separado.

**Architecture:** `HomeWizard` novo componente standalone substitui `SidebarPage` como home. `ResultsPage` é reescrito como Guided Discovery com 4 blocos sequenciais. `MiniPlayer.handleExport` gera zip com 5 arquivos `.mid` separados por instrumento.

**Tech Stack:** React 18 + TypeScript + Tone.js (player.ts) + fflate (zips) + Groq API (analyze-song.ts)

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `api/analyze-song.ts` | Modificar | Adicionar campo `explanation` ao prompt e response |
| `src/components/SongSearch.tsx` | Modificar | Adicionar `explanation?: string` ao tipo `SongAnalysis` |
| `src/components/HomeWizard.tsx` | **Criar** | Wizard standalone de 4 passos (página inteira) |
| `src/App.tsx` | Modificar | Rotear `home` → HomeWizard, `results` → ResultsPage |
| `src/components/ResultsPage.tsx` | Reescrever | Guided Discovery: Blocos A/B/C/D |
| `src/components/MiniPlayer.tsx` | Modificar | `handleExport` → zip com 5 arquivos por instrumento |

`SidebarPage.tsx`, `AIWizard.tsx` (modal), `player.ts` e todo o áudio **não mudam**.

---

## Task 1: Adicionar `explanation` ao Groq e ao tipo SongAnalysis

**Files:**
- Modify: `api/analyze-song.ts`
- Modify: `src/components/SongSearch.tsx`

- [ ] **Step 1: Adicionar `explanation` ao tipo SongAnalysis**

Em `src/components/SongSearch.tsx`, localizar `export interface SongAnalysis` (linha ~20) e adicionar o campo:

```typescript
export interface SongAnalysis {
  key: string
  mode: string
  bpm_original: number
  progression: string
  progression_degrees: string
  character: string
  borrowed_chords: string[]
  sections?: SongSection[]
  explanation?: string          // ← adicionar aqui
  spotify?: { energy: number; danceability: number } | null
  remix_guide: {
    style: string
    bpm: number
    structure: { time: string; section: string; description: string }[]
    instruments: { role: string; suggestion: string }[]
    tips: string[]
  }
}
```

- [ ] **Step 2: Adicionar `explanation` ao prompt do Groq**

Em `api/analyze-song.ts`, dentro da função `analyzeWithGroq`, localizar o bloco de JSON de exemplo no prompt (após `"tips": [...]`) e adicionar antes do fechamento `}`:

```typescript
// Localizar esta parte no prompt (antes do fechamento do JSON):
//   "tips": [
//     "Specific tip for this remix",
//     "Second production tip"
//   ]
// }
// Substituir por:
    "tips": [
      "Specific tip for this remix",
      "Second production tip"
    ]
  },
  "explanation": "Duas ou três frases em português do Brasil descrevendo como esta música soa emocionalmente e por que funciona no estilo ${targetStyle}. REGRAS ABSOLUTAS: zero termos de teoria musical (proibido: acorde, progressão, tônica, dominante, grau, modo, escala, Fmaj7, ii-V-I, emprestado, extensão). Use APENAS metáforas sensoriais: pesado, flutuante, urgente, quente, cheio, melancólico, tenso, leve, denso, solto. Máximo 3 frases."
}`
```

O campo `explanation` fica no nível raiz do JSON (mesmo nível de `key`, `mode`, etc.), fora de `remix_guide`.

- [ ] **Step 3: Verificar que a response inclui explanation**

Rodar o servidor de dev e testar o endpoint manualmente:

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npm run dev:full
```

Em outro terminal:
```bash
curl -X POST http://localhost:3000/api/analyze-song \
  -H "Content-Type: application/json" \
  -d '{"artist":"The Weeknd","title":"Blinding Lights","targetStyle":"House","targetBpm":128,"lang":"pt-BR"}' \
  | jq '.explanation'
```

Esperado: string com 2-3 frases em português, sem termos de teoria. Se vier `null`, revisar o prompt.

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add api/analyze-song.ts src/components/SongSearch.tsx
git commit -m "feat: add explanation field to analyze-song — producer language, zero theory"
```

---

## Task 2: Criar HomeWizard.tsx (wizard standalone de página inteira)

**Files:**
- Create: `src/components/HomeWizard.tsx`

Este componente substitui o SidebarPage como tela inicial. É uma página inteira (não modal). Faz o fetch do analyze-song ao clicar "Gerar" no passo 3.

- [ ] **Step 1: Criar o arquivo**

Criar `src/components/HomeWizard.tsx` com o seguinte conteúdo:

```typescript
import { useState, useRef } from 'react'
import type { SongAnalysis } from './SongSearch'

const STYLES = ['House', 'Deep House', 'Gospel House', 'Afro House', 'Tech House', 'Jazz', 'Lo-fi', 'Techno']

const FEELINGS = [
  { id: 'groovy', label: 'Groovy' },
  { id: 'soulful', label: 'Soulful' },
  { id: 'dark', label: 'Dark' },
  { id: 'tribal', label: 'Tribal' },
  { id: 'jazzy', label: 'Jazzy' },
  { id: 'uplifting', label: 'Uplifting' },
  { id: 'melancólico', label: 'Melancólico' },
  { id: 'energético', label: 'Energético' },
]

export interface WizardSong {
  id: string
  title: string
  artist: string
  cover: string | null
}

export interface WizardResult {
  song: WizardSong
  style: string
  bpm: number
  feeling: string[]
  analysis: SongAnalysis
}

interface Props {
  onComplete: (result: WizardResult) => void
}

interface SongOption {
  id: string
  title: string
  artist: string
  album: string
  cover: string | null
}

function SongSearch({ onSelect }: { onSelect: (song: SongOption) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SongOption[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SongOption | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleQuery = (q: string) => {
    setQuery(q)
    setSelected(null)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search-songs?q=${encodeURIComponent(q)}`)
        const data = await res.json() as SongOption[]
        setResults(Array.isArray(data) ? data : [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 350)
  }

  const handlePick = (s: SongOption) => {
    setSelected(s)
    setQuery(`${s.artist} — ${s.title}`)
    setOpen(false)
    onSelect(s)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => handleQuery(e.target.value)}
        placeholder="Ex: Lionel Richie — Stuck on You"
        className="input-neumorphic w-full pl-4 pr-8 py-3 text-sm"
        style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-spin" style={{ color: 'var(--color-muted)' }}>◌</span>
      )}
      {selected && (
        <button onClick={() => { setSelected(null); setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-muted)' }}>✕</button>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl overflow-hidden" style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          {results.slice(0, 5).map(s => (
            <button key={s.id} onClick={() => handlePick(s)} className="w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-0 transition-colors" style={{ borderColor: 'var(--color-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-card-hi)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s.cover
                ? <img src={s.cover} alt="" className="w-8 h-8 rounded-lg shrink-0 object-cover" />
                : <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>🎵</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{s.title}</p>
                <p className="font-mono text-[11px] truncate" style={{ color: 'var(--color-muted)' }}>{s.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function HomeWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [song, setSong] = useState<SongOption | null>(null)
  const [style, setStyle] = useState('House')
  const [bpm, setBpm] = useState(124)
  const [feeling, setFeeling] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleFeeling = (id: string) =>
    setFeeling(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : prev.length < 2 ? [...prev, id] : prev
    )

  const handleGenerate = async () => {
    if (!song) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analyze-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: song.artist, title: song.title, targetStyle: style, targetBpm: bpm, lang: 'pt-BR' }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const analysis = await res.json() as SongAnalysis
      onComplete({ song: { id: song.id, title: song.title, artist: song.artist, cover: song.cover }, style, bpm, feeling, analysis })
    } catch (err) {
      setError('Não foi possível analisar a música. Tente novamente.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
        <p className="font-mono text-sm" style={{ color: 'var(--color-muted)' }}>Analisando {song?.title}...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-[480px]">
        {/* Logo / título */}
        <div className="text-center mb-10">
          <h1 className="font-sans text-3xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>ChordFlip</h1>
          <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>transforme qualquer música em MIDI pronto pro Ableton</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i <= step ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>

        <div className="card p-8">
          {/* Passo 0: Música */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Qual música você quer remixar?</p>
              <SongSearch onSelect={s => { setSong(s); setStep(1) }} />
            </div>
          )}

          {/* Passo 1: Estilo */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Qual o estilo do remix?</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${style === s ? 'btn-primary' : 'btn-neumorphic'}`}
                    style={style !== s ? { color: 'var(--color-ink)' } : {}}
                  >{s}</button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="text-xs" style={{ color: 'var(--color-muted)' }}>← Voltar</button>
                <button onClick={() => setStep(2)} className="btn-primary px-5 py-2 text-sm rounded-xl">Próximo →</button>
              </div>
            </div>
          )}

          {/* Passo 2: BPM */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Qual o BPM?</p>
              <input type="range" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
              <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                <span>60</span>
                <span className="font-bold text-lg" style={{ color: 'var(--color-ink)' }}>{bpm} BPM</span>
                <span>180</span>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="text-xs" style={{ color: 'var(--color-muted)' }}>← Voltar</button>
                <button onClick={() => setStep(3)} className="btn-primary px-5 py-2 text-sm rounded-xl">Próximo →</button>
              </div>
            </div>
          )}

          {/* Passo 3: Feeling */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Qual o feeling? <span className="text-sm font-normal" style={{ color: 'var(--color-muted)' }}>(opcional)</span></p>
              <div className="flex flex-wrap gap-2">
                {FEELINGS.map(f => (
                  <button key={f.id} onClick={() => toggleFeeling(f.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${feeling.includes(f.id) ? 'btn-primary' : 'btn-neumorphic'}`}
                    style={!feeling.includes(f.id) ? { color: 'var(--color-muted)' } : {}}
                  >{f.label}</button>
                ))}
              </div>
              {error && <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(232,138,138,0.1)', color: '#e88a8a' }}>{error}</p>}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-xs" style={{ color: 'var(--color-muted)' }}>← Voltar</button>
                <button onClick={handleGenerate} className="btn-primary px-6 py-2.5 text-sm rounded-xl font-semibold">
                  Gerar remix ✦
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila sem erros de TypeScript**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros relacionados a `HomeWizard.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/HomeWizard.tsx
git commit -m "feat: HomeWizard — standalone 4-step wizard page"
```

---

## Task 3: App.tsx — rotear HomeWizard + ResultsPage

**Files:**
- Modify: `src/App.tsx`

O `appMode === 'home'` hoje renderiza `<SidebarPage>`. Substituir por `<HomeWizard>`. Adicionar `appMode === 'results'` renderizando `<ResultsPage>` com os dados do wizard.

- [ ] **Step 1: Adicionar imports no topo de App.tsx**

Localizar as linhas de import existentes e adicionar após os imports de componentes:

```typescript
import { HomeWizard, type WizardResult } from './components/HomeWizard'
```

- [ ] **Step 2: Adicionar estado wizardResult**

Dentro de `export default function App()`, após a linha `const [appMode, setAppMode] = useState<'home' | 'results' | 'advanced'>('home')`, adicionar:

```typescript
const [wizardResult, setWizardResult] = useState<WizardResult | null>(null)
```

- [ ] **Step 3: Substituir o bloco home/results**

Localizar o bloco condicional atual (começa com `if (appMode === 'home' || appMode === 'results')`):

```typescript
// REMOVER este bloco:
if (appMode === 'home' || appMode === 'results') {
  return (
    <SidebarPage
      onAdvanced={(result) => enterAdvanced(result)}
    />
  )
}
```

Substituir por:

```typescript
if (appMode === 'home') {
  return (
    <HomeWizard
      onComplete={(result) => {
        setWizardResult(result)
        setAppMode('results')
      }}
    />
  )
}

if (appMode === 'results' && wizardResult) {
  return (
    <ResultsPage
      analysis={wizardResult.analysis}
      song={{ title: wizardResult.song.title, artist: wizardResult.song.artist, cover: wizardResult.song.cover }}
      genreName={wizardResult.style}
      bpm={wizardResult.bpm}
      onAdvanced={() => {
        enterAdvanced({
          analysis: wizardResult.analysis,
          song: { title: wizardResult.song.title, artist: wizardResult.song.artist, cover: wizardResult.song.cover },
          genreName: wizardResult.style,
          bpm: wizardResult.bpm,
        })
      }}
      onBack={() => setAppMode('home')}
    />
  )
}
```

- [ ] **Step 4: Verificar que ResultsPage ainda é importado**

Confirmar que o import de ResultsPage já existe no App.tsx. Se não, adicionar:

```typescript
import { ResultsPage } from './components/ResultsPage'
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Testar no browser**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npm run dev:full
```

Abrir http://localhost:3000. Verificar:
- Aparece o HomeWizard (wizard de página inteira, não o SidebarPage)
- Consegue selecionar uma música e avançar os passos
- Após clicar "Gerar remix" aparece o spinner de loading

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/App.tsx
git commit -m "feat: App.tsx — rota home → HomeWizard, results → ResultsPage"
```

---

## Task 4: ResultsPage.tsx — Blocos A e B

**Files:**
- Modify: `src/components/ResultsPage.tsx`

Reescrever o JSX da ResultsPage mantendo toda a lógica de dados (fullSong, markers, scale, etc.) e substituindo o layout pelos Blocos A e B. O Bloco A é o header com AI Coach. O Bloco B é um MiniPlayer completo tocando o arranjo todo (ext='7', versão Quente, como preview padrão).

⚠️ **Manter `export interface SectionMarker`** — é importado por MiniPlayer.tsx e SidebarPage.tsx.

- [ ] **Step 1: Adicionar import de SongAnalysis com explanation**

No topo de `ResultsPage.tsx`, verificar que o import de `SongAnalysis` vem de `./SongSearch`:

```typescript
import type { SongAnalysis } from './SongSearch'
```

O campo `explanation` já estará disponível pois foi adicionado na Task 1.

- [ ] **Step 2: Substituir o JSX do return principal**

Localizar o bloco `return (` principal (após todos os `useMemo`/`useCallback`) e substituir **apenas o JSX dentro do return**, mantendo intacta toda a lógica acima (fullSong, markers, scale, sectionColorMap, currentMarkerIdx, etc.).

O novo JSX do `return`:

```typescript
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
            <img src={song.cover} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
          )}
          <div>
            <h2 className="font-sans text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{song.title}</h2>
            <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {song.artist} · {genreName} · {bpm} BPM
            </p>
          </div>
        </div>

        {analysis.explanation && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)', opacity: 0.85 }}>
            {analysis.explanation}
          </p>
        )}
      </section>

      {/* ── BLOCO B: Ouça o arranjo completo ── */}
      <section className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Ouça o arranjo completo</h3>
        <MiniPlayer
          chords={fullSong.chords}
          markers={fullSong.markers}
          scale={scale}
          ext="7"
          label="Preview"
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
      </section>

      {/* Seções */}
      {fullSong.markers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {fullSong.markers.map((m, i) => {
            const isActive = currentMarkerIdx === i
            const sColor = sectionColorMap[m.name] ?? 'var(--color-muted)'
            return (
              <span key={i} className="font-mono text-[11px] px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: isActive ? `${sColor}33` : 'var(--color-card)',
                  color: isActive ? sColor : 'var(--color-muted)',
                  border: `1px solid ${isActive ? sColor : 'var(--color-border)'}`,
                  fontWeight: isActive ? 700 : 400,
                }}>
                {m.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Placeholder para Blocos C e D — serão adicionados nas Tasks 5 e 6 */}

      {/* Link modo avançado */}
      <div className="text-center pt-4">
        <button onClick={onAdvanced} className="font-mono text-xs opacity-60 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-muted)' }}>
          → Explorar no modo avançado
        </button>
      </div>

    </div>
  </div>
)
```

- [ ] **Step 3: Adicionar estado soloPlaying ao componente**

Dentro da função `ResultsPage`, após os estados existentes (`activeExt`, `activeProgress`, `showTimeline`), adicionar:

```typescript
const [soloPlaying, setSoloPlaying] = useState<string | null>(null)
```

- [ ] **Step 4: Verificar TypeScript e browser**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npx tsc --noEmit 2>&1 | head -20
```

Abrir http://localhost:3000, completar o wizard, verificar:
- Bloco A aparece com cover, título, artista, BPM e texto do AI Coach
- Bloco B mostra um MiniPlayer "Preview" funcional

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/ResultsPage.tsx
git commit -m "feat: ResultsPage — Blocos A e B (AI Coach + player completo)"
```

---

## Task 5: ResultsPage.tsx — Bloco C (elementos isolados com solo play)

**Files:**
- Modify: `src/components/ResultsPage.tsx`

Adicionar o Bloco C: 5 linhas (Piano, Bass, Arpejo, Pad, Lead) com botão de ouvir isolado. O solo usa `playMiniArrangement` passando apenas os eventos do instrumento em questão. Inclui aviso de bateria.

- [ ] **Step 1: Adicionar imports necessários**

No topo de `ResultsPage.tsx`, verificar e adicionar se necessário:

```typescript
import { playMiniArrangement, stopMiniArrangement } from '../audio/player'
import { genEvents, TPQ } from '../core/groove'
import { genArpeggioEvents, genPadEvents, genLeadEvents } from '../core/arranger'
```

- [ ] **Step 2: Criar função handleSoloPlay**

Dentro da função `ResultsPage`, após o `handleProgress` existente, adicionar:

```typescript
const handleSoloPlay = useCallback(async (track: 'piano' | 'bass' | 'arpejo' | 'pad' | 'lead') => {
  stopMiniArrangement()
  handleStop()
  setSoloPlaying(track)

  const { pe, be } = genEvents(fullSong.chords, '7', genre, 0.58, 'off')
  const ae = genArpeggioEvents(fullSong.chords, '7', scale)
  const pde = genPadEvents(fullSong.chords, '7', scale)
  const le = genLeadEvents(fullSong.chords, '7', scale)

  await playMiniArrangement({
    kickEvents: [],
    clapEvents: [],
    hihatEvents: [],
    pianoEvents:    track === 'piano'  ? pe  : [],
    bassEvents:     track === 'bass'   ? be  : [],
    arpeggioEvents: track === 'arpejo' ? ae  : [],
    padEvents:      track === 'pad'    ? pde : [],
    leadEvents:     track === 'lead'   ? le  : [],
    bpm,
    tpq: TPQ,
    onEnd: () => setSoloPlaying(null),
  })
}, [fullSong.chords, genre, scale, bpm, handleStop])

const handleSoloStop = useCallback(() => {
  stopMiniArrangement()
  setSoloPlaying(null)
}, [])
```

- [ ] **Step 3: Adicionar Bloco C no JSX**

Localizar o comentário `{/* Placeholder para Blocos C e D */}` no JSX e substituir por:

```typescript
{/* ── BLOCO C: O que compõe este remix ── */}
<section className="space-y-3">
  <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>O que compõe este remix</h3>

  <div className="card divide-y" style={{ divideColor: 'var(--color-border)' }}>
    {([
      { id: 'piano',  label: 'Piano',  desc: 'Dá a harmonia — o corpo da música' },
      { id: 'bass',   label: 'Bass',   desc: 'Dá o groove — o que faz a cabeça balançar' },
      { id: 'arpejo', label: 'Arpejo', desc: 'Dá movimento — notas que sobem e descem' },
      { id: 'pad',    label: 'Pad',    desc: 'Dá profundidade — preenche o espaço' },
      { id: 'lead',   label: 'Lead',   desc: 'Dá a melodia — a voz que guia' },
    ] as const).map(({ id, label, desc }) => {
      const isPlaying = soloPlaying === id
      return (
        <div key={id} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{label}</p>
            <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
          </div>
          <button
            onClick={() => isPlaying ? handleSoloStop() : handleSoloPlay(id)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0"
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

{/* Placeholder Bloco D */}
```

- [ ] **Step 4: Testar solo play no browser**

Abrir http://localhost:3000, completar wizard, verificar:
- Bloco C aparece com 5 linhas
- Clicar ▶ em "Piano" toca só o piano
- Clicar ■ para enquanto
- Clicar outra faixa enquanto uma toca troca para a nova
- Aviso de bateria visível

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/ResultsPage.tsx
git commit -m "feat: ResultsPage — Bloco C (solo play por instrumento)"
```

---

## Task 6: ResultsPage.tsx — Bloco D (versões com autoplay + download)

**Files:**
- Modify: `src/components/ResultsPage.tsx`

4 cards (Clean/Quente/Rico/Completo). Clicar num card inicia autoplay daquela versão. Botão de download aparece no card selecionado. "Baixar tudo" no rodapé.

- [ ] **Step 1: Adicionar estado selectedExt**

Dentro de `ResultsPage`, após `soloPlaying`, adicionar:

```typescript
const [selectedExt, setSelectedExt] = useState<Extension | null>(null)
```

- [ ] **Step 2: Substituir o placeholder Bloco D no JSX**

Localizar `{/* Placeholder Bloco D */}` e substituir por:

```typescript
{/* ── BLOCO D: Escolha sua versão ── */}
<section className="space-y-4">
  <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Escolha sua versão</h3>

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
            borderLeft: `3px solid ${isSelected ? color : 'var(--color-border)'}`,
            background: isSelected ? `${color}11` : 'var(--color-card)',
            outline: isSelected ? `1px solid ${color}44` : 'none',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sans font-bold text-base" style={{ color: isSelected ? color : 'var(--color-ink)' }}>{label}</p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{tagline}</p>
            </div>
            <span className="text-xs mt-0.5" style={{ color: isPlaying ? color : 'var(--color-muted)' }}>
              {isPlaying ? '▶' : '○'}
            </span>
          </div>
        </button>
      )
    })}
  </div>

  {/* Player da versão selecionada (oculto visualmente, só para controle de áudio) */}
  {selectedExt && (
    <div className="mt-2">
      <MiniPlayer
        chords={fullSong.chords}
        markers={fullSong.markers}
        scale={scale}
        ext={selectedExt}
        label={EXT_CONFIGS.find(e => e.ext === selectedExt)?.label ?? ''}
        tagline=""
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

{/* Baixar tudo */}
<section className="space-y-2">
  <button
    onClick={handleDownloadAll}
    className="w-full py-4 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
    style={{ background: 'var(--color-card)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
  >
    ↓ Baixar todas as versões — 5 trilhas cada (.zip)
  </button>
  <p className="font-mono text-[11px] text-center" style={{ color: 'var(--color-muted)' }}>
    Bateria não inclusa. Piano, bass, arpejo, pad e lead separados por arquivo.
  </p>
</section>
```

- [ ] **Step 3: Verificar que EXT_CONFIGS está definido no arquivo**

Confirmar que a constante `EXT_CONFIGS` existe em `ResultsPage.tsx`. Ela estava no arquivo original. Se foi removida na reescrita, adicionar antes do `return`:

```typescript
const EXT_CONFIGS: { ext: Extension; label: string; tagline: string; color: string }[] = [
  { ext: 'tri', label: 'Clean',    tagline: 'Direto ao ponto',  color: '#7ad1a8' },
  { ext: '7',   label: 'Quente',   tagline: 'Mais corpo',       color: '#8ab4f0' },
  { ext: '9',   label: 'Rico',     tagline: 'Harmonia densa',   color: '#c084fc' },
  { ext: '11',  label: 'Completo', tagline: 'Arranjo cheio',    color: '#f0a84a' },
]
```

- [ ] **Step 4: Testar autoplay e seleção**

Abrir http://localhost:3000, completar wizard, verificar:
- 4 cards aparecem no Bloco D
- Clicar num card → player da versão inicia automaticamente
- Card selecionado fica destacado com a cor da versão
- MiniPlayer aparece abaixo dos cards para controle
- Clicar outro card → troca a versão tocando

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/ResultsPage.tsx
git commit -m "feat: ResultsPage — Bloco D (versões com autoplay + seleção)"
```

---

## Task 7: MiniPlayer.tsx — export zip por instrumento

**Files:**
- Modify: `src/components/MiniPlayer.tsx`

Substituir o `handleExport` atual (que gera um `.mid` com todas as trilhas) por um que gera um `.zip` com 5 arquivos separados: `piano.mid`, `bass.mid`, `arpejo.mid`, `pad.mid`, `lead.mid`.

- [ ] **Step 1: Adicionar import zipSync**

No topo de `MiniPlayer.tsx`, verificar se `zipSync` já é importado de `fflate`. Se não:

```typescript
import { zipSync } from 'fflate'
```

- [ ] **Step 2: Substituir handleExport**

Localizar `const handleExport = () => {` (linha ~150) e substituir o bloco inteiro por:

```typescript
const handleExport = () => {
  const ae  = genArpeggioEvents(chords, ext, scale)
  const pde = genPadEvents(chords, ext, scale)
  const le  = genLeadEvents(chords, ext, scale)

  const folder = `${songSlug}-${label.replace(/ /g, '')}`
  const tempo = trackBytes([], bpm, 'Tempo')

  const files: Record<string, Uint8Array> = {
    [`${folder}/piano.mid`]:  new Uint8Array(midiFile([tempo, trackBytes(pe,  null, 'Piano')])),
    [`${folder}/bass.mid`]:   new Uint8Array(midiFile([tempo, trackBytes(be,  null, 'Bass')])),
    [`${folder}/arpejo.mid`]: new Uint8Array(midiFile([tempo, trackBytes(ae,  null, 'Arpejo')])),
    [`${folder}/pad.mid`]:    new Uint8Array(midiFile([tempo, trackBytes(pde, null, 'Pad')])),
    [`${folder}/lead.mid`]:   new Uint8Array(midiFile([tempo, trackBytes(le,  null, 'Lead')])),
  }

  const zipped = zipSync(files)
  const url = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${folder}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Testar download no browser**

Completar o wizard, clicar no botão de download de um MiniPlayer. Verificar:
- Baixa um arquivo `.zip` (não `.mid`)
- Zip contém pasta `[slug]-[versao]/` com 5 arquivos: `piano.mid`, `bass.mid`, `arpejo.mid`, `pad.mid`, `lead.mid`
- Cada `.mid` abre no Ableton como uma faixa só (não multi-canal)

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/MiniPlayer.tsx
git commit -m "feat: MiniPlayer — export zip com 5 arquivos separados por instrumento"
```

---

## Task 8: ResultsPage.tsx — "Baixar tudo" por instrumento

**Files:**
- Modify: `src/components/ResultsPage.tsx`

Substituir o `handleDownloadAll` atual (que gera um `.mid` por extensão) por um que gera um zip master com 4 pastas (uma por extensão) cada com 5 arquivos de instrumento.

- [ ] **Step 1: Adicionar imports**

No topo de `ResultsPage.tsx`, adicionar se necessário:

```typescript
import { zipSync } from 'fflate'
```

- [ ] **Step 2: Substituir handleDownloadAll**

Localizar `const handleDownloadAll = () => {` e substituir o bloco inteiro por:

```typescript
const handleDownloadAll = useCallback(() => {
  const files: Record<string, Uint8Array> = {}
  const extLabels: Record<Extension, string> = { tri: '3notas', '7': '4notas', '9': '5notas', '11': '6notas' }

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
```

- [ ] **Step 3: Verificar que Extension é importado**

Confirmar que `Extension` está no import de types no topo do arquivo:

```typescript
import type { Extension, ParsedChord } from '../types'
```

- [ ] **Step 4: Testar download all**

Clicar "Baixar todas as versões" na ResultsPage. Verificar:
- Zip baixado contém 4 pastas: `[slug]/3notas/`, `[slug]/4notas/`, `[slug]/5notas/`, `[slug]/6notas/`
- Cada pasta tem 5 arquivos: `piano.mid`, `bass.mid`, `arpejo.mid`, `pad.mid`, `lead.mid`
- Total: 20 arquivos `.mid` no zip

- [ ] **Step 5: Commit e push**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/components/ResultsPage.tsx
git commit -m "feat: ResultsPage — Baixar tudo com zip por instrumento (4 versões × 5 trilhas)"
git push
```

---

## Critérios de Aceitação

Antes de declarar concluído, verificar cada item:

- [ ] Wizard de 4 passos aparece como home (não SidebarPage)
- [ ] Bloco A: cover + nome + texto do AI Coach sem tecniquês
- [ ] Bloco B: player toca o arranjo completo
- [ ] Bloco C: cada instrumento tem play isolado funcional, aviso de bateria visível
- [ ] Bloco D: clicar card inicia autoplay da versão, card fica destacado
- [ ] Download individual: zip com 5 arquivos separados
- [ ] Download all: zip com 4 pastas × 5 arquivos
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Push feito para main → Vercel deploy automático
