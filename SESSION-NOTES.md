# Reharm Studio — Spec do Produto
_Sessão de brainstorming: 01/06/2026_

---

## Visão

Ferramenta web que transforma o nome de uma música em progressões harmônicas ricas, prontas para remix — separadas por instrumento, exportadas em MIDI, adaptadas ao gênero e BPM escolhidos pelo produtor.

O produtor não precisa saber teoria musical. Ele informa a música de referência, o BPM alvo e o estilo. O sistema faz o resto.

---

## Problema

Produtores que fazem remixes sabem o que querem recriar mas não sabem como construir progressões ricas e adequadas ao gênero alvo. O projeto original (reharm-studio.html) resolveu parcialmente isso, mas era engessado: só transformava progressões coladas manualmente, sem inteligência, sem variedade harmônica real (9ª, 11ª, alterações), sem estrutura por seção.

---

## Persona

**Bitran** — DJ/produtor brasileiro, Ableton Live. Tem intuição musical, bom ouvido, mas pouco mapeamento teórico. Workflow: identifica a música que quer remixar → precisa de progressões harmônicas ricas pro gênero que produz → arrasta os MIDIs pro Ableton → constrói o restante do arranjo.

---

## Fluxo Principal (MVP)

```
1. Usuário digita o nome da música
   ex: "Lionel Richie — Stuck on You"

2. Sistema pesquisa e identifica automaticamente:
   → Tonalidade (F maior)
   → Progressão original (Fmaj7 – Am7 – Bbmaj7 – C7)
   → Estrutura da música (Intro / Verso / Refrão / Bridge)
   → Caráter emocional (soul, R&B, emocional, quente)

3. Usuário define:
   → BPM alvo (ex: 124)
   → Estilo alvo (House / Deep House / Gospel House / Afro House / Jazz / etc.)

4. Sistema gera — por seção, por instrumento:
   → 3–5 progressões com voicings ricos (7ª, 9ª, 11ª, alterações)
   → Preview de áudio para cada progressão
   → Explicação do caráter de cada sugestão

5. Usuário escolhe a progressão que quer para cada seção

6. Sistema exporta MIDIs separados por instrumento e seção:
   stuck-on-you-verse-piano.mid
   stuck-on-you-verse-bass.mid
   stuck-on-you-verse-strings.mid
   stuck-on-you-chorus-piano.mid
   ...
```

---

## Decisões de Design

### Input
- Campo: nome da música (pesquisa automática via web + Claude API)
- Campo: BPM alvo (manual)
- Campo: estilo alvo (seletor)
- Campos manuais disponíveis como fallback (se pesquisa não encontrar)
- Suporte a variações por seção (a música pode mudar de campo harmônico)

### Progressões
- **Modelo híbrido (aprovado):** biblioteca de esqueletos harmônicos curados + enriquecimento automático por estilo
- Esqueleto: graus da escala (I–IV–V, ii–V–I, I–iii–IV–V, etc.)
- Enriquecimento: voicings com extensões adequadas ao estilo (9ª, #11, 13ª, alterações)
- Sistema sugere 3–5 variantes por seção, cada uma com caráter diferente

### Instrumentos
- Cada instrumento tem 3 dimensões: papel harmônico, padrão rítmico, registro
- Presets por gênero (House: Piano + Bass + Strings)
- Qualquer gênero, qualquer instrumento — não limitado a House
- Para instrumentos sem preset, usuário pode definir o padrão rítmico

### Export
- MIDI separado por instrumento + seção
- Nomeado com: música + seção + instrumento
- Formatos: piano.mid, bass.mid, strings.mid, full.mid

---

## Arquitetura Técnica

```
Frontend   →  React 18 + Vite + TypeScript
Estilo     →  Tailwind CSS (dark, profissional — definido em sessão de design)
Áudio      →  Tone.js (preview)
MIDI       →  Custom writer (já implementado e testado no protótipo)

Backend    →  Node.js (necessário para Claude API + pesquisa web)
AI         →  Claude API (análise de músicas, geração de progressões)
Pesquisa   →  Web search / MusicBrainz para identificar tonalidade e acordes

Deploy     →  Frontend: Vercel | Backend: Railway ou Fly.io
```

**Por que web (não desktop):**
- Depende de internet de qualquer forma (Claude API)
- Acesso imediato sem instalação
- Atualizações instantâneas na biblioteca de progressões
- Mais acessível para outros produtores

---

## Base Existente (porta do protótipo)

O arquivo `reharm-studio_1.html` (Downloads) tem código testado e funcional:
- Parser de acordes (regex + quality table, ~25 qualidades)
- Reharmonizador (reVoice + classify, tri/7/9)
- MIDI writer (SMF type 0 e 1, VLQ, TPQ 480)
- Groove engine (swing 50–66%, viradas: reto / antecipação / viradas+)
- Preview Tone.js (PolySynth piano + MonoSynth bass)
- 5 gêneros com presets (House, Deep House, Lo-fi, Pop, Techno)

Todo esse código vai para os módulos core do projeto React.

---

## O que falta em relação ao protótipo

| Feature | Status |
|---|---|
| Pesquisa automática por nome da música | ❌ Novo |
| Claude API para análise e geração | ❌ Novo |
| Estrutura por seções da música | ❌ Novo |
| Galeria de progressões com seleção | ❌ Novo |
| Voicings com 9ª, 11ª, alterações reais | ❌ Novo |
| Exportar por instrumento + seção | ❌ Novo |
| Suporte a qualquer gênero/instrumento | ❌ Novo |
| Grid visual 16-step (F7 do PRD) | ❌ Pendente |
| Interface profissional (design session) | ❌ Pendente |

---

## Próximos Passos

1. **Sessão de Design** — interface moderna, refinada, profissional (próxima sessão)
2. **Scaffolding** — criar projeto React/Vite/TS, portar módulos core do HTML
3. **Backend** — Node.js + Claude API + pesquisa web
4. **Biblioteca de progressões** — esqueletos curados por Bitran + enriquecimento automático
5. **Deploy MVP** — Vercel + Railway

---

## Exemplo de Uso Real

> "Estou fazendo o remix de Stuck on You — Lionel Richie"
> BPM: 124 | Estilo: Deep House

Sistema identifica: F maior, I–iii–IV–V, caráter soul/gospel
Sistema sugere:
- `Fmaj9 – Am11 – Bbmaj9 – C9` — original enriquecida
- `Fmaj9 – Dm9 – Bbmaj7 – C9` — gospel house (Am → Dm)
- `Fmaj9 – Gm9 – C9 – Fmaj9` — ii–V–I deep europeu
- `Fmaj9 – Ebmaj7 – Bbmaj9 – C9` — modal/afro

Exporta: piano, bass, strings — por seção — prontos pro Ableton.
