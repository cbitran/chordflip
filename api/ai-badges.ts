// POST /api/ai-badges
// Body: { chords: string[], style: string, bpm: number, feeling: string[], tonicNum: number | null, lang?: string }
// Returns: { badges: ChordBadgeData[] }

export const config = { runtime: 'edge' }

const LANG_INSTRUCTION: Record<string, string> = {
  en: 'All text values must be in English.',
  es: 'Todos los valores de texto deben estar en español.',
  'pt-BR': 'Todos os valores de texto devem estar em português do Brasil.',
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json() as {
      chords: string[]
      style: string
      bpm: number
      feeling: string[]
      tonicNum: number | null
      lang?: string
    }

    const { chords, style, bpm, feeling, tonicNum, lang = 'pt-BR' } = body
    const langInstruction = LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION['pt-BR']
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) throw new Error('GROQ_API_KEY não configurada')

    const tonicLabel = tonicNum !== null ? NOTE_NAMES[tonicNum] : 'unspecified'

    const prompt = `You are a music harmony coach. Evaluate each chord in context.

Context:
- Key: ${tonicLabel}
- Style: ${style}
- BPM: ${bpm}
- Feeling: ${feeling.join(', ') || 'not specified'}

Chords to evaluate: ${chords.join(', ')}

For each chord, assign:
- level: "good" (fits perfectly), "ok" (works with a caveat), or "bad" (clashes with the context)
- explanation: exactly 2 sentences explaining why, in the target language

IMPORTANT: ${langInstruction}
Respond ONLY with valid JSON, no markdown:
{
  "badges": [
    { "chord": "Fmaj9", "level": "good", "explanation": "..." },
    { "chord": "Am11", "level": "ok", "explanation": "..." }
  ]
}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${res.status} — ${err}`)
    }

    const data = await res.json() as { choices: { message: { content: string } }[] }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as {
      badges?: { chord: string; level: string; explanation: string }[]
    }

    return new Response(
      JSON.stringify({ badges: parsed.badges ?? [] }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro ao avaliar acordes', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
}
