# Reharm Studio v2 — UX Spec Completo
**Data:** 2026-06-01  
**Status:** Seção 1 aprovada · Seções 2–8 redigidas para aprovação

---

## Seção 1 — Fluxo Principal (APROVADA)

Resumo: estado inicial sempre Solo, botão "Chamar IA" sempre visível, IA como observadora silenciosa.  
Ver detalhes completos em `SESSION-NOTES.md > UX Redesign`.

---

## Seção 2 — Botão "Chamar IA"

### Posição

Fixo no canto superior direito do `<Navbar>`, ao lado do seletor de tema e do avatar de usuário.

```
[ Reharm ]   ........navbar........   [ 🤝 Chamar IA ]   [ ☀/🌙 ]   [ avatar ]
```

- Não flutua sobre o conteúdo — faz parte da barra de navegação.
- Presente em todas as rotas do app (incluindo Account, Legal).
- Em mobile (< 768px): ícone apenas, sem texto.

### Estados visuais

| Estado | Visual | Quando ocorre |
|--------|--------|---------------|
| **Idle** | Ícone `✦` + texto "Chamar IA", cor `--color-muted`, border suave | App aberto, IA não foi chamada |
| **Processando** | Spinner pequeno dentro do botão, texto "Pensando..." | Após clique, durante chamada ao Groq |
| **Ativa** | Ícone `✦` pulsando lentamente (CSS animation), badge "IA ativa" em `--color-primary`, border `var(--color-primary)` | Após IA entregar sugestão |
| **Encerrada** | Volta ao estado Idle | Usuário clica "Dispensar IA" ou abre nova sessão |

### Transição ao clicar

1. Botão vai para estado **Processando** imediatamente (feedback instantâneo).
2. Se zero state (nenhuma música selecionada) → abre **Wizard** (Seção 3).
3. Se estado parcial (tem música, acordes, estilo ou BPM) → IA lê contexto e abre **Painel de Contexto** (Seção 4).
4. Ao encerrar a IA: botão anima de volta ao idle em 300ms (fade de cor).

### Comportamento da "observação silenciosa"

Enquanto IA está no estado **Ativa**, ela assina as mudanças de estado da sessão (React context):
- Música selecionada
- Acordes no campo harmônico
- Estilo e BPM selecionados
- Feeling (se definido no wizard)
- Progressão atual no grid

Esse snapshot é mantido em memória e enviado ao Groq somente quando o usuário clica o botão novamente ou solicita nova sugestão.  
**Nenhuma chamada automática ao Groq** — a IA só processa quando chamada.

---

## Seção 3 — Wizard (IA chamada no zero state)

Ativado quando o usuário clica "Chamar IA" sem ter selecionado música, estilo ou BPM.

### Apresentação visual

Modal centralizado, 540px de largura, fundo `--color-surface`, sombra neumórfica.  
Indicador de progresso no topo: 4 dots, o ativo em `--color-primary`.  
Título consistente acima dos dots: `"Vamos criar juntos"`

### Passo 1 — Música de referência

```
Qual música você quer remixar?

[ 🔍 Buscar música...                              ]
  ┌─────────────────────────────────────────────┐
  │ 🎵 Stuck on You · Lionel Richie · 1984      │
  │ 🎵 Stuck on You · Elvis Presley · 1960      │
  └─────────────────────────────────────────────┘

                              [ Pular → ]
```

- Campo reutiliza o componente `<SongSearch>` existente (iTunes API).
- Selecionar uma música avança automaticamente para o Passo 2.
- A análise harmônica é disparada ao Groq em background (sem exibir resultado ainda).
- "Pular" avança sem música — IA usará somente o estilo/feeling para gerar.

### Passo 2 — Estilo alvo

```
Que estilo você está fazendo?

  [ House ]  [ Deep House ]  [ Afro House ]  [ Gospel House ]
  [ Tech House ]  [ Jazz ]  [ Lo-fi ]  [ Techno ]

                  [ ← Voltar ]   [ Próximo → ]
```

- Chips de seleção única, um ativo por vez.
- Clique num chip o seleciona (cor `--color-primary`).
- Avançar sem selecionar → IA usa o estilo já definido no app, ou omite.

### Passo 3 — BPM

```
Que BPM você está buscando?

  ⬤——————————●————————————⬤
  80                124              180

  Sugestão: 122 BPM  (baseado na análise de Stuck on You)

                  [ ← Voltar ]   [ Próximo → ]
```

- Slider, range 60–180.
- Sugestão aparece abaixo do slider baseada na análise do Groq (passo 1 background).
- Se música foi pulada: sem sugestão.
- Clicar na sugestão posiciona o slider nela.

### Passo 4 — Feeling

```
Qual o feeling que você quer?

  [ Groovy ]  [ Soulful ]  [ Dark ]  [ Tribal ]
  [ Jazzy ]  [ Uplifting ]  [ Melancólico ]  [ Energético ]

                  [ ← Voltar ]   [ Gerar ✦ ]
```

- Multi-seleção permitida (até 2 chips ativos).
- "Gerar" dispara: botão do wizard vai para spinner.

### Passo 5 — Geração

```
✦  Gerando sua progressão...

   Analisando Stuck on You
   Cruzando: Deep House · 124 BPM · Soulful + Groovy
   Construindo progressão...

   [==========80%=========   ]
```

- Barra de progresso animada (não reflete progresso real — é UX feedback).
- Ao Groq retornar: wizard fecha, painel de sugestão abre (Seção 5).

---

## Seção 4 — Contexto-Awareness (IA chamada no meio)

Ativado quando usuário clica "Chamar IA" com estado parcial: tem pelo menos música ou acordes definidos.

### Leitura de estado

A IA recebe silenciosamente:
```json
{
  "song": "Stuck on You — Lionel Richie",
  "key": "F major",
  "style": "Deep House",
  "bpm": 124,
  "feeling": null,
  "chords": ["Fmaj7", "Am7", "Bbmaj7", "C7"],
  "harmonicField": ["F", "G", "A", "Bb", "C", "D", "E"],
  "progression": ["Fmaj9", "Am11", "Bbmaj9", "?"]
}
```

### Painel lateral (não modal)

Abre como painel deslizante à direita, 360px de largura, sem bloquear o app.  
O usuário pode continuar editando o campo harmônico enquanto o painel está aberto.

```
┌─────────────────────────────────────────┐
│  ✦ IA Ativa                        [×]  │
│─────────────────────────────────────────│
│  Vejo que você está em Fá maior,        │
│  Deep House a 124 BPM.                  │
│                                         │
│  Você tem Fmaj9 – Am11 – Bbmaj9         │
│  e um quarto acorde em aberto.          │
│  O C9 fecha a cadência perfeitamente    │
│  e mantém o groove house.               │
│                                         │
│  Quer que eu sugira um caminho          │
│  para o quarto acorde?                  │
│                                         │
│  [ Sim, sugira ]   [ Não, obrigado ]    │
└─────────────────────────────────────────┘
```

### Regras de contexto

- IA **não faz perguntas de contexto** — ela já sabe tudo.
- IA pode fazer **uma pergunta de intenção** se o estado for ambíguo  
  (ex: "Você quer mais tensão ou resolução aqui?")
- Se o estado for completo e claro: IA vai direto à sugestão sem perguntar.
- O painel fecha com `[×]` ou ao clicar fora dele.

### Pergunta de intenção (quando necessária)

```
┌─────────────────────────────────────────┐
│  ✦ IA Ativa                        [×]  │
│─────────────────────────────────────────│
│  Você tem tensão harmônica no           │
│  compasso 3 (acorde suspenso).          │
│                                         │
│  O que você prefere?                    │
│                                         │
│  [ Resolver a tensão ]                  │
│  [ Manter e intensificar ]              │
│  [ Me surpreenda ]                      │
└─────────────────────────────────────────┘
```

Após escolha → Groq gera sugestão → abre Seção 5.

---

## Seção 5 — Tela de Resultado (Sugestão da IA)

Substitui o painel lateral ou abre abaixo do campo harmônico (se veio do wizard).

### Layout — resultado no painel lateral (fluxo mid-session)

```
┌─────────────────────────────────────────┐
│  ✦ Sugestão da IA                  [×]  │
│─────────────────────────────────────────│
│  Fmaj9  →  Am11  →  Bbmaj9  →  C9sus4  │
│                                         │
│  "O C9sus4 antes do Fmaj9 cria          │
│   antecipação típica do Deep House      │
│   europeu — tensão que se resolve       │
│   na volta pro tônico."                 │
│                                         │
│  [ ✓ Aceitar ]  [ ✏ Editar ]  [ Descar ]│
└─────────────────────────────────────────┘
```

### Layout — resultado após wizard (zero state)

Painel aparece abaixo do `<SongSearch>`, empurrando o conteúdo para baixo.  
Mesmo formato: acordes em row + explicação + ações.

### Acordes da sugestão

- Cada acorde: chip clicável, fundo `--color-primary-light`, texto branco.
- Ao hover: toca preview de áudio (Tone.js, timbre Piano, 500ms).
- Os chips mostram o acorde completo com extensões (Fmaj9, não F).

### Ações

| Ação | Comportamento |
|------|---------------|
| **Aceitar** | Aplica a progressão no campo harmônico. Painel fecha. Badges aparecem. |
| **Editar** | Aplica a progressão no campo harmônico e mantém painel aberto para ajustes. |
| **Descartar** | Painel fecha, estado do app não muda. Botão "Chamar IA" volta ao Idle. |

### Comportamento "Aceitar"

1. Chips da sugestão animam com fade-out.
2. Acordes são aplicados no `<HarmonicField>`.
3. `<UnifiedPlayer>` atualiza automaticamente (reativa os eventos).
4. Badges do AI Coach aparecem no `<HarmonicField>` (Seção 6).
5. Painel fecha com slide-out à direita.

---

## Seção 6 — Campo Harmônico com AI Coach

O `<HarmonicField>` não muda estruturalmente. Quando a IA está ativa (após aceitar sugestão ou após mid-session), cada acorde recebe um badge de contexto.

### Badges por acorde

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Fmaj9   │  │  Am11    │  │ Bbmaj9   │  │ C9sus4   │
│          │  │          │  │          │  │          │
│    🟢    │  │    🟢    │  │    🟡    │  │    🟢    │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

| Badge | Significado |
|-------|-------------|
| 🟢 | Funciona perfeitamente: dentro do campo harmônico, adequado ao estilo e feeling |
| 🟡 | Funciona com ressalva: tensão intencional, nota estranha, fuga modal |
| 🔴 | Foge do contexto: acorde que não se encaixa harmonicamente |

### Tooltip ao clicar no badge

Popover de 2 linhas, posicionado acima do acorde:

```
┌──────────────────────────────────────────┐
│  🟡 Bbmaj9                               │
│  Subdominante com 9ª — cria brilho soul  │
│  típico de gospel house. Funcionará bem  │
│  se o próximo for C ou G.               │
└──────────────────────────────────────────┘
```

- Fecha ao clicar fora ou pressionar Esc.
- Máximo 2 linhas de texto (explicação concisa).

### Quando os badges são gerados

- **Uma vez por sugestão aceita**: ao aceitar a sugestão, todos os badges são gerados em uma única call ao Groq.
- **Ao trocar um acorde manualmente**: badge do acorde trocado é regenerado (1 call ao Groq).
- **Nunca por keystroke**: só após o usuário confirmar a troca de acorde.
- Badges existentes nos outros acordes permanecem — não são re-gerados.

### Quando os badges desaparecem

- Ao clicar "Dispensar IA" → todos os badges somem.
- Ao recarregar a página (badges não são persistidos).
- Ao carregar outro projeto do localStorage.

---

## Seção 7 — Remix Preview

Sem mudanças estruturais em relação à implementação atual.

### O que permanece

- `<UnifiedPlayer>` com Kick + Chords + Bass
- Mute/Solo por trilha
- Seletor de timbre (Pad / Pluck / Lead / Piano)
- Grid visual de 16 steps
- Export MIDI por trilha (Chords e Bass)
- Play/Stop com playhead

### Integração com a IA

Quando o usuário aceita uma sugestão da IA (Seção 5):
- O `<UnifiedPlayer>` recebe os novos `pianoEvents` e `bassEvents` automaticamente via props.
- Se estava tocando: para, recarrega os eventos, exibe os novos steps no grid.
- Se estava parado: aguarda o próximo Play.

**Nenhuma UI nova é adicionada ao Remix Preview** — a integração é transparente via estado do app.

---

## Seção 8 — O que não muda

Estas funcionalidades permanecem exatamente como estão, sem alteração de UI ou comportamento:

| Feature | Componente | Observação |
|---------|-----------|------------|
| Export MIDI por trilha | `<TrackRow>`, `midi-writer.ts` | Sem mudança |
| Groove Controls | `<GrooveControls>` | Swing + viradas |
| Seletor de gênero | `<GenreSelector>` | 8 gêneros, presets |
| Busca de música | `<SongSearch>` | Reutilizado no wizard |
| Campo harmônico visual | `<HarmonicField>` | Só badges são adicionados |
| Temas light/dark | Tailwind vars | Sem mudança |
| i18n PT/EN/ES | `src/i18n/` | Novas chaves serão adicionadas |
| Auth Supabase | `src/contexts/` | Sem mudança |
| Galeria de progressões | `<ProgressionGallery>` | Sem mudança |
| Layout 1440px sidebar | `<Layout>`, `<Sidebar>` | Sem mudança |

### Novas chaves i18n necessárias

```
ai.callButton        = "Chamar IA"
ai.thinking          = "Pensando..."
ai.active            = "IA ativa"
ai.wizardTitle       = "Vamos criar juntos"
ai.step1             = "Qual música você quer remixar?"
ai.step2             = "Que estilo você está fazendo?"
ai.step3             = "Que BPM você está buscando?"
ai.step4             = "Qual o feeling que você quer?"
ai.generating        = "Gerando sua progressão..."
ai.suggestion        = "Sugestão da IA"
ai.accept            = "Aceitar"
ai.edit              = "Editar"
ai.discard           = "Descartar"
ai.badgeGood         = "Funciona perfeitamente"
ai.badgeOk           = "Funciona com ressalva"
ai.badgeBad          = "Foge do contexto"
```

---

## Resumo das mudanças vs. app atual

| Área | Mudança |
|------|---------|
| `<Navbar>` | Adicionar botão "Chamar IA" com estados |
| `<AIWizard>` | Novo componente (modal, 4 passos) |
| `<AIPanel>` | Novo componente (painel lateral deslizante) |
| `<HarmonicField>` | Adicionar badges e popover de explicação |
| `api/analyze-song.ts` | Receber style + bpm + feeling do usuário |
| `src/contexts/` | Novo AIContext (estado da IA, snapshot de sessão) |
| `src/i18n/` | Novas chaves ai.* |
| Todo o resto | Sem mudança |

---

## Próximo passo

Escrever o plano de implementação em `docs/superpowers/plans/YYYY-MM-DD-ai-coach.md`:
- AIContext (estado reativo da sessão)
- Componente AIWizard
- Componente AIPanel
- Modificações em HarmonicField (badges)
- Modificações em analyze-song.ts (receber intenção do usuário)
