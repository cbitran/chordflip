// POST /api/suggest-progressions
// Body: { song, style, bpm, feeling }
// Returns: { progressions: SuggestedProgression[] }

export const config = { runtime: 'edge' }

function validateGroove(raw: unknown) {
  if (!raw || typeof raw !== 'object') return undefined
  const g = raw as Record<string, unknown>

  const pianoSteps = Array.isArray(g.pianoSteps)
    ? (g.pianoSteps as number[]).filter(s => Number.isInteger(s) && s >= 0 && s <= 15)
    : null
  const bassSteps = Array.isArray(g.bassSteps)
    ? (g.bassSteps as number[]).filter(s => Number.isInteger(s) && s >= 0 && s <= 15)
    : null

  if (!pianoSteps?.length || !bassSteps?.length) return undefined

  const validViradas = ['off', 'antecip', 'full']

  return {
    pianoSteps,
    pianoDur: typeof g.pianoDur === 'number' ? Math.max(50, Math.min(1000, g.pianoDur)) : 150,
    bassSteps,
    bassDur: typeof g.bassDur === 'number' ? Math.max(50, Math.min(1000, g.bassDur)) : 200,
    swing: typeof g.swing === 'number' ? Math.max(50, Math.min(75, g.swing)) : 56,
    viradas: validViradas.includes(g.viradas as string) ? g.viradas : 'antecip',
  }
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { song, style, bpm, feeling } = await req.json() as {
    song: string
    style: string
    bpm: number
    feeling: string
  }

  const prompt = `Você é um produtor musical especialista em múltiplos gêneros.
O usuário quer remixar "${song}" no estilo ${style}, ${bpm} BPM, feeling: ${feeling}.

Gere EXATAMENTE 5 progressões de acordes diferentes para este contexto.
Cada progressão deve ter 4 acordes com extensões ricas (maj9, m9, 7sus4, m7, maj7, etc).

Para cada progressão, sugira também um perfil de groove que se encaixe no estilo musical dela:
- "pianoSteps": lista de 3-6 posições rítmicas (inteiros de 0 a 15, onde 0=tempo1, 4=tempo2, 8=tempo3, 12=tempo4, 2=contratempo do tempo1, 6=contratempo do tempo2, etc.)
- "pianoDur": duração de cada nota em ticks (100=staccato curto, 300=médio, 700=legato longo) — base: 480 ticks = 1 tempo
- "bassSteps": posições do baixo (normalmente mais esparso que o piano)
- "bassDur": duração das notas do baixo em ticks
- "swing": porcentagem de swing de 50 (reto) a 72 (swing intenso)
- "viradas": "off" (groove reto), "antecip" (antecipações suaves), ou "full" (viradas completas)

Exemplos de referência por estilo:
- House: pianoSteps:[2,6,10,14] pianoDur:150 bassSteps:[0,8] bassDur:200 swing:56 viradas:"antecip"
- Deep House: pianoSteps:[2,6,10,14] pianoDur:140 bassSteps:[0,8,14] bassDur:180 swing:55 viradas:"antecip"
- Jazz: pianoSteps:[0,3,6,9,12] pianoDur:220 bassSteps:[0,2,4,6,8,10,12,14] bassDur:180 swing:66 viradas:"full"
- Lo-fi: pianoSteps:[0,8] pianoDur:700 bassSteps:[0,8] bassDur:600 swing:62 viradas:"off"
- Gospel: pianoSteps:[0,2,6,8,10,14] pianoDur:130 bassSteps:[0,4,8,12,14] bassDur:140 swing:54 viradas:"full"

Adapte o groove ao feeling e à música — uma balada pede grooves mais espaçados e legatos, um track agitado pede stabs curtos e densos.

Responda APENAS com JSON válido, sem markdown, sem explicação:
[
  {
    "name": "nome criativo em português",
    "mood": "adjetivo · adjetivo",
    "chords": ["Xm9", "Ymaj7", "Zsus4", "Wm7"],
    "groove": {
      "pianoSteps": [2,6,10,14],
      "pianoDur": 150,
      "bassSteps": [0,8],
      "bassDur": 200,
      "swing": 56,
      "viradas": "antecip"
    }
  },
  ...5 itens total
]`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 900,
      }),
    })

    const data = await groqRes.json() as { choices: { message: { content: string } }[] }
    const raw = data.choices[0]?.message?.content ?? '[]'
    const match = raw.match(/\[[\s\S]*\]/)
    const items: unknown[] = match ? JSON.parse(match[0]) : []

    const progressions = items.map((item) => {
      const p = item as Record<string, unknown>
      return {
        name: String(p.name ?? ''),
        mood: String(p.mood ?? ''),
        chords: Array.isArray(p.chords) ? (p.chords as string[]) : [],
        groove: validateGroove(p.groove),
      }
    }).filter(p => p.chords.length > 0)

    return new Response(JSON.stringify({ progressions }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('suggest-progressions error:', err)
    return new Response(JSON.stringify({ progressions: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
