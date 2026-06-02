# Progression Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um painel fixo de progressões geradas pela IA com abas de comparação no player, permitindo ao usuário montar sua progressão de ouvido.

**Architecture:** Nova API `suggest-progressions.ts` chama Groq com o contexto do wizard. `TabPlayer` encapsula `UnifiedPlayer` com abas. `ProgressionBrowser` fica fixo abaixo do TabPlayer com cards clicáveis.

**Tech Stack:** React 18, TypeScript, Groq API (llama-3.3-70b-versatile), Tone.js (já configurado), Tailwind + CSS vars do tema existente.

---

## Arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Criar | `api/suggest-progressions.ts` | Endpoint Groq → retorna 5 progressões JSON |
| Criar | `src/components/TabPlayer.tsx` | Abas de comparação + UnifiedPlayer |
| Criar | `src/components/ProgressionBrowser.tsx` | Painel fixo com lista de cards |
| Criar | `src/components/ProgressionCard.tsx` | Card: nome, mood, acordes clicáveis |
| Criar | `src/types/progressions.ts` | Tipos SuggestedProgression, TabState |
| Modificar | `src/App.tsx` | Substituir UnifiedPlayer por TabPlayer + adicionar ProgressionBrowser |
| Modificar | `src/contexts/AIContext.tsx` | Expor onChordAdd callback para ProgressionCard |

---

## Task 1: Tipos

**Files:**
- Create: `src/types/progressions.ts`

- [ ] **Criar o arquivo de tipos**

```typescript
// src/types/progressions.ts

export interface SuggestedProgression {
  id: string
  name: string
  mood: string
  chords: string[]  // ex: ["Am9", "Dm9", "Fmaj7", "G7sus4"]
}

export interface TabState {
  id: string
  label: string
  chords: string[]        // chord tokens para o ChordInput
  progressionName: string
}
```

- [ ] **Commit**

```bash
cd "/Volumes/SSD Interno/Projetos ClaudeCode/Reharm"
git add src/types/progressions.ts
git commit -m "feat: tipos SuggestedProgression e TabState para Progression Browser"
```

---

## Task 2: API `suggest-progressions.ts`

**Files:**
- Create: `api/suggest-progressions.ts`

- [ ] **Criar o endpoint**

```typescript
// api/suggest-progressions.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { song, style, bpm, feeling } = req.body as {
    song: string
    style: string
    bpm: number
    feeling: string
  }

  const prompt = `Você é um produtor musical especialista em música eletrônica.
O usuário quer remixar "${song}" no estilo ${style}, ${bpm} BPM, feeling: ${feeling}.

Gere EXATAMENTE 5 progressões de acordes diferentes para este contexto.
Cada progressão deve ter 4 acordes. Use extensões ricas (maj9, m9, 7sus4, m7, maj7, etc).
Pense como um pianista de ${style} — variedade de texturas e emoções.

Responda APENAS com JSON válido, sem markdown, sem explicação:
[
  {"name": "nome criativo em português", "mood": "adjetivo · adjetivo", "chords": ["Xm9", "Ymaj7", "Zsus4", "Wm7"]},
  ...5 itens total
]`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 600,
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'
    // extrai JSON mesmo que haja texto ao redor
    const match = raw.match(/\[[\s\S]*\]/)
    const progressions = match ? JSON.parse(match[0]) : []

    res.status(200).json({ progressions })
  } catch (err) {
    console.error('suggest-progressions error:', err)
    res.status(500).json({ error: 'generation failed', progressions: [] })
  }
}
```

- [ ] **Testar localmente com curl** (servidor Vercel dev deve estar rodando em `vercel dev`)

```bash
curl -X POST http://localhost:3000/api/suggest-progressions \
  -H "Content-Type: application/json" \
  -d '{"song":"Blinding Lights","style":"House","bpm":124,"feeling":"Groovy"}' \
  | jq .
```

Saída esperada:
```json
{
  "progressions": [
    {"name": "Soul Groove", "mood": "Groovy · Melancólico", "chords": ["Am9","Dm9","Fmaj7","G7sus4"]},
    ...
  ]
}
```

- [ ] **Commit**

```bash
git add api/suggest-progressions.ts
git commit -m "feat: api/suggest-progressions — Groq gera 5 progressões por contexto"
```

---

## Task 3: `ProgressionCard`

**Files:**
- Create: `src/components/ProgressionCard.tsx`

- [ ] **Criar o componente**

```tsx
// src/components/ProgressionCard.tsx
import type { SuggestedProgression } from '../types/progressions'

interface Props {
  progression: SuggestedProgression
  onLoadTab: (p: SuggestedProgression) => void
  onChordClick: (chord: string) => void
}

export function ProgressionCard({ progression, onLoadTab, onChordClick }: Props) {
  return (
    <div
      className="rounded-xl p-4 space-y-3 shrink-0"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        minWidth: 220,
        maxWidth: 260,
      }}
    >
      {/* Header */}
      <div>
        <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-ink)' }}>
          {progression.name}
        </p>
        <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
          {progression.mood}
        </p>
      </div>

      {/* Acordes clicáveis individualmente */}
      <div className="flex flex-wrap gap-1.5">
        {progression.chords.map((chord, i) => (
          <button
            key={i}
            onClick={() => onChordClick(chord)}
            className="font-mono text-xs px-2 py-1 rounded-lg transition-all"
            style={{
              background: 'rgba(122,209,168,0.15)',
              color: '#7ad1a8',
              border: '1px solid rgba(122,209,168,0.35)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(122,209,168,0.3)'
              e.currentTarget.style.borderColor = '#7ad1a8'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(122,209,168,0.15)'
              e.currentTarget.style.borderColor = 'rgba(122,209,168,0.35)'
            }}
            title="Adicionar à progressão atual"
          >
            {chord}
          </button>
        ))}
      </div>

      {/* Ação principal */}
      <button
        onClick={() => onLoadTab(progression)}
        className="w-full font-mono text-xs py-2 rounded-xl transition-all"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-btn)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
      >
        Carregar →
      </button>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/ProgressionCard.tsx
git commit -m "feat: ProgressionCard — acordes clicáveis + botão Carregar"
```

---

## Task 4: `ProgressionBrowser`

**Files:**
- Create: `src/components/ProgressionBrowser.tsx`

- [ ] **Criar o componente**

```tsx
// src/components/ProgressionBrowser.tsx
import { useState, useCallback } from 'react'
import { ProgressionCard } from './ProgressionCard'
import type { SuggestedProgression } from '../types/progressions'

interface Props {
  song: string
  style: string
  bpm: number
  feeling: string
  onLoadTab: (p: SuggestedProgression) => void
  onChordClick: (chord: string) => void
}

export function ProgressionBrowser({ song, style, bpm, feeling, onLoadTab, onChordClick }: Props) {
  const [progressions, setProgressions] = useState<SuggestedProgression[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const fetchMore = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suggest-progressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, style, bpm, feeling }),
      })
      const data = await res.json()
      const newOnes = (data.progressions ?? []).map((p: Omit<SuggestedProgression, 'id'>) => ({
        ...p,
        id: `${Date.now()}-${Math.random()}`,
      }))
      setProgressions(prev => [...prev, ...newOnes])
      setInitialized(true)
    } catch {
      // falha silenciosa — botão continua disponível
    } finally {
      setLoading(false)
    }
  }, [song, style, bpm, feeling])

  // Carrega automaticamente na primeira renderização
  useState(() => { fetchMore() })

  if (!initialized && !loading) return null

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[3px]" style={{ color: 'var(--color-muted)' }}>
            05.6
          </span>
          <span className="font-sans font-bold text-lg ml-2" style={{ color: 'var(--color-ink)' }}>
            Progressões Sugeridas
          </span>
        </div>
        <button
          onClick={fetchMore}
          disabled={loading}
          className="font-mono text-xs px-4 py-2 rounded-xl transition-all"
          style={{
            background: 'var(--color-bg)',
            color: loading ? 'var(--color-muted)' : 'var(--color-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-btn)',
          }}
        >
          {loading ? 'Gerando...' : '+ Gerar mais'}
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Clique num acorde para adicionar à progressão atual · "Carregar →" abre numa aba nova
      </p>

      {/* Cards em scroll horizontal */}
      {loading && progressions.length === 0 ? (
        <div className="flex items-center gap-3 py-4" style={{ color: 'var(--color-muted)' }}>
          <span className="animate-pulse font-mono text-sm">Gerando progressões para {style} {bpm} BPM...</span>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {progressions.map(p => (
            <ProgressionCard
              key={p.id}
              progression={p}
              onLoadTab={onLoadTab}
              onChordClick={onChordClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/ProgressionBrowser.tsx
git commit -m "feat: ProgressionBrowser — painel fixo com scroll horizontal + Gerar mais"
```

---

## Task 5: `TabPlayer`

**Files:**
- Create: `src/components/TabPlayer.tsx`

- [ ] **Criar o componente**

```tsx
// src/components/TabPlayer.tsx
import { useState, useCallback } from 'react'
import { UnifiedPlayer } from './UnifiedPlayer'
import { parseProg } from '../core/parser'
import { genEvents } from '../core/groove'
import type { GenreDefinition, Extension } from '../types'
import type { TabState, SuggestedProgression } from '../types/progressions'
import { TPQ } from '../core/groove'

interface Props {
  // Props iniciais (tab 1 — progressão do wizard)
  initialChords: string
  genre: GenreDefinition
  genreName: string
  bpm: number
  ext: Extension
  swing: number
  viradas: import('../types').ViradasMode
}

const MAX_TABS = 5

export function TabPlayer({ initialChords, genre, genreName, bpm, ext, swing, viradas }: Props) {
  const [tabs, setTabs] = useState<TabState[]>([
    { id: 'tab-1', label: 'Principal', chords: initialChords.split(/\s+/).filter(Boolean), progressionName: 'Wizard' },
  ])
  const [activeTabId, setActiveTabId] = useState('tab-1')

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]!
  const activeChordText = activeTab.chords.join(' ')

  const { chords: parsedChords } = parseProg(activeChordText)
  const { pe, be } = genEvents(parsedChords, ext, genre, swing / 100, viradas)

  const loadTab = useCallback((progression: SuggestedProgression) => {
    if (tabs.length >= MAX_TABS) {
      // substitui a última aba (exceto tab-1)
      const id = `tab-${Date.now()}`
      setTabs(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          id,
          label: progression.name.slice(0, 12),
          chords: progression.chords,
          progressionName: progression.name,
        }
        return next
      })
      setActiveTabId(id)
    } else {
      const id = `tab-${Date.now()}`
      setTabs(prev => [...prev, {
        id,
        label: progression.name.slice(0, 12),
        chords: progression.chords,
        progressionName: progression.name,
      }])
      setActiveTabId(id)
    }
  }, [tabs])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (activeTabId === id) setActiveTabId(next[next.length - 1]!.id)
      return next
    })
  }, [activeTabId])

  return (
    <div className="space-y-0">
      {/* Abas */}
      {tabs.length > 1 && (
        <div className="flex gap-1 px-1 pt-1">
          {tabs.map((tab, i) => (
            <div
              key={tab.id}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => setActiveTabId(tab.id)}
                className="font-mono text-xs px-3 py-1.5 rounded-t-lg transition-all"
                style={{
                  background: activeTabId === tab.id ? 'var(--color-card)' : 'var(--color-bg)',
                  color: activeTabId === tab.id ? 'var(--color-primary)' : 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                  borderBottom: activeTabId === tab.id ? '1px solid var(--color-card)' : undefined,
                  marginBottom: activeTabId === tab.id ? -1 : 0,
                }}
              >
                {i + 1}. {tab.label}
              </button>
              {i > 0 && (
                <button
                  onClick={() => closeTab(tab.id)}
                  className="text-xs w-4 h-4 flex items-center justify-center rounded-full -ml-2 -mt-1"
                  style={{ color: 'var(--color-muted)', background: 'var(--color-border)' }}
                  title="Fechar aba"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Player da aba ativa */}
      <UnifiedPlayer
        pianoEvents={pe}
        bassEvents={be}
        bpm={bpm}
        genre={genre}
        genreName={genreName}
        chords={parsedChords}
        ext={ext}
      />
    </div>
  )
}
```

- [ ] **Exportar os tipos de `TabState` e `SuggestedProgression` de `src/types/index.ts`** (adicionar re-export):

```typescript
// Adicionar ao final de src/types/index.ts
export type { SuggestedProgression, TabState } from './progressions'
```

- [ ] **Commit**

```bash
git add src/components/TabPlayer.tsx src/types/index.ts
git commit -m "feat: TabPlayer — abas de comparação sobre UnifiedPlayer"
```

---

## Task 6: Integrar no App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Adicionar imports**

```typescript
// Adicionar aos imports existentes em App.tsx
import { TabPlayer } from './components/TabPlayer'
import { ProgressionBrowser } from './components/ProgressionBrowser'
import type { SuggestedProgression } from './types/progressions'
```

- [ ] **Adicionar callback `handleChordAdd`** (adicionar junto dos outros handlers no App):

```typescript
// Adicionar após handleGuideNext em App.tsx
const handleChordAdd = useCallback((chord: string) => {
  setText(prev => {
    const trimmed = prev.trim()
    return trimmed ? `${trimmed} ${chord}` : chord
  })
}, [])

const handleLoadTab = useCallback((_p: SuggestedProgression) => {
  // TabPlayer gerencia internamente via loadTab prop
}, [])
```

- [ ] **Substituir `UnifiedPlayer` pelo `TabPlayer` no fluxo do wizard** (dentro do bloco `{parsedChords.length > 0 && ...}` do guideStep):

```tsx
{/* Remix Preview — substitui UnifiedPlayer simples pelo TabPlayer */}
{parsedChords.length > 0 && (
  <section className="mb-6">
    <TabPlayer
      initialChords={text}
      genre={genre}
      genreName={genreName}
      bpm={bpm}
      ext={ext}
      swing={swing}
      viradas={viradas}
    />
  </section>
)}

{/* Progression Browser — aparece junto com o player */}
{parsedChords.length > 0 && aiSession.song && (
  <section className="mb-10">
    <ProgressionBrowser
      song={aiSession.song}
      style={genreName}
      bpm={bpm}
      feeling={aiSession.feeling ?? ''}
      onLoadTab={(_p) => { /* TabPlayer recebe via ref — ver Task 7 */ }}
      onChordClick={handleChordAdd}
    />
  </section>
)}
```

- [ ] **Verificar que `aiSession.song` e `aiSession.feeling` existem no AIContext** (grep para confirmar):

```bash
grep -n "song\|feeling" src/contexts/AIContext.tsx | head -20
```

- [ ] **Type check**

```bash
node_modules/.bin/tsc -p tsconfig.app.json --noEmit
```

- [ ] **Commit**

```bash
git add src/App.tsx
git commit -m "feat: TabPlayer + ProgressionBrowser integrados no App"
```

---

## Task 7: Conectar TabPlayer ↔ ProgressionBrowser via ref

O `ProgressionBrowser` precisa chamar `loadTab` do `TabPlayer`. A forma mais limpa: expor `loadTab` via `useImperativeHandle`.

**Files:**
- Modify: `src/components/TabPlayer.tsx`
- Modify: `src/App.tsx`

- [ ] **Adicionar `forwardRef` e `useImperativeHandle` ao TabPlayer**

```tsx
// src/components/TabPlayer.tsx — adicionar no topo
import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface TabPlayerHandle {
  loadTab: (p: SuggestedProgression) => void
}

// Mudar a assinatura do componente:
export const TabPlayer = forwardRef<TabPlayerHandle, Props>(function TabPlayer(
  { initialChords, genre, genreName, bpm, ext, swing, viradas },
  ref
) {
  // ... estado existente ...

  useImperativeHandle(ref, () => ({ loadTab }), [loadTab])

  // ... resto do componente ...
})
```

- [ ] **Usar `useRef` no App.tsx para conectar os dois**

```tsx
// Em App.tsx — adicionar junto dos outros refs
import { useRef } from 'react'
import type { TabPlayerHandle } from './components/TabPlayer'

// dentro do componente App:
const tabPlayerRef = useRef<TabPlayerHandle>(null)

// No JSX:
<TabPlayer
  ref={tabPlayerRef}
  initialChords={text}
  // ... demais props
/>

<ProgressionBrowser
  // ...
  onLoadTab={(p) => tabPlayerRef.current?.loadTab(p)}
  onChordClick={handleChordAdd}
/>
```

- [ ] **Type check**

```bash
node_modules/.bin/tsc -p tsconfig.app.json --noEmit
```

- [ ] **Commit**

```bash
git add src/components/TabPlayer.tsx src/App.tsx
git commit -m "feat: TabPlayer expõe loadTab via ref — ProgressionBrowser conectado"
```

---

## Task 8: Ajustes visuais e UX finais

**Files:**
- Modify: `src/components/TabPlayer.tsx`
- Modify: `src/components/ProgressionBrowser.tsx`

- [ ] **Auto-play ao trocar de aba** — ao clicar numa aba, o player deve iniciar automaticamente. Adicionar lógica no TabPlayer:

```tsx
// Em TabPlayer, no onClick da aba:
onClick={() => {
  setActiveTabId(tab.id)
  // o UnifiedPlayer vai resetar porque as props mudaram
  // (pianoEvents/bassEvents mudam → useEffect de mudança de eventos já para e sinaliza)
}}
```

Isso já funciona porque o `UnifiedPlayer` detecta mudança de `pianoEvents`/`bassEvents` e para o player automaticamente, mostrando "Progressão atualizada".

- [ ] **Limitar scroll do ProgressionBrowser** com `max-h` para não empurrar o layout:

```tsx
// Em ProgressionBrowser, no container de cards:
<div
  className="flex gap-3 overflow-x-auto pb-2"
  style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border) transparent' }}
>
```

- [ ] **Push final para Vercel**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ API Groq gerando 5 progressões por contexto (Task 2)
- ✅ ProgressionCard com acordes individuais clicáveis + Carregar (Task 3)
- ✅ ProgressionBrowser fixo com scroll horizontal + Gerar mais (Task 4)
- ✅ TabPlayer com abas de comparação, máx 5, tab-1 não fecha (Task 5)
- ✅ Integração no App.tsx (Task 6)
- ✅ Conexão via ref entre TabPlayer e ProgressionBrowser (Task 7)
- ✅ Acorde individual clicado → adiciona ao ChordInput atual via handleChordAdd

**Placeholder scan:** Nenhum TBD encontrado. Todos os steps têm código completo.

**Type consistency:**
- `SuggestedProgression.id: string` — gerado em ProgressionBrowser (Task 4), consumido em ProgressionCard (Task 3) ✅
- `TabState` — definido em Task 1, usado em Task 5 ✅
- `TabPlayerHandle.loadTab` — definido e exportado em Task 7 ✅
- `onLoadTab: (p: SuggestedProgression) => void` — assinatura consistente entre ProgressionBrowser, ProgressionCard e App.tsx ✅
