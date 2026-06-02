# Progression Browser — Design Spec
**Data:** 2026-06-01  
**Projeto:** ChordFlip (reharm-studio)

## Filosofia

O ouvido é o árbitro. A teoria é invisível. A IA garante coerência musical, o usuário valida pelo que soa bem. A ferramenta é um parceiro produtor, não um professor de teoria.

## Fluxo

```
Wizard (estilo / BPM / feeling / música)
  ↓ IA gera progressão principal
TabPlayer — Tab 1 (progressão do wizard, automática)
  ↓ sempre visível abaixo
ProgressionBrowser — painel fixo
  → 4-5 cards com progressões alternativas (Groq)
  → acorde individual clicado → adiciona ao ChordInput
  → "Carregar →" → abre nova aba no TabPlayer
  → "Gerar mais" → chama Groq novamente
  ↓ usuário monta sua progressão ouvindo
Exporta MIDI
```

## Componentes

### TabPlayer
- Wrapper do UnifiedPlayer com abas de comparação
- Tab 1: progressão do wizard (não fecha)
- Tab 2-5: carregadas pelo usuário via ProgressionBrowser
- Clicar aba → carrega progressão + toca automaticamente
- Botão ✕ fecha abas 2-5

### ProgressionBrowser
- Painel fixo abaixo do TabPlayer
- Gerado uma vez ao fim do wizard via `api/suggest-progressions.ts`
- Botão "Gerar mais" adiciona 4-5 novos cards

### ProgressionCard
```
┌──────────────────────────────────┐
│ House Soul Loop · Groovy         │
│ [Am9] [Dm9] [Fmaj7] [G7sus4]   │
│                     [Carregar →] │
└──────────────────────────────────┘
```
- Cada acorde é clicável → adiciona ao ChordInput atual
- "Carregar →" → toda a progressão numa nova aba

### API: `api/suggest-progressions.ts`
- Input: `{ song, style, bpm, feeling }`
- Groq gera 5 progressões: `{ name, mood, chords[] }`
- Exemplo de resposta:
```json
[
  { "name": "House Soul Loop", "mood": "Groovy · Melancólico", "chords": ["Am9","Dm9","Fmaj7","G7sus4"] }
]
```

## O que NÃO muda
- `UnifiedPlayer` — sem alteração de interface
- `ChordInput` — recebe chords via callback existente
- `AIContext` — fornece o contexto (song/style/bpm/feeling) sem mudança
- `GuideNarration` — permanece como está

## Componentes novos
| Arquivo | Responsabilidade |
|---|---|
| `src/components/TabPlayer.tsx` | Gerencia abas + UnifiedPlayer |
| `src/components/ProgressionBrowser.tsx` | Painel fixo com lista de cards |
| `src/components/ProgressionCard.tsx` | Card individual |
| `api/suggest-progressions.ts` | Endpoint Groq |
