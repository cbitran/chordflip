// POST /api/ai-suggest
// Body: { session: AISession, intention?: string, lang?: string }
// Returns: { chords: string[], explanation: string }

export const config = { runtime: 'edge' }

const LANG_INSTRUCTION: Record<string, string> = {
  en: 'All text values must be in English.',
  es: 'Todos los valores de texto deben estar en español.',
  'pt-BR': 'Todos os valores de texto devem estar em português do Brasil.',
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json() as {
      session: {
        song: { artist: string; title: string } | null
        style: string
        bpm: number
        feeling: string[]
        chords: string[]
        tonicNum: number | null
      }
      intention?: string
      lang?: string
    }

    const { session, intention, lang = 'pt-BR' } = body
    const langInstruction = LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION['pt-BR']
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) throw new Error('GROQ_API_KEY não configurada')

    const songContext = session.song
      ? `The reference song is "${session.song.title}" by ${session.song.artist}.`
      : 'No reference song provided.'

    const chordsContext = session.chords.length > 0
      ? `The user already has these chords: ${session.chords.join(' – ')}.`
      : 'The user has no chords yet.'

    const intentionContext = intention
      ? `The user's intention: "${intention}".`
      : ''

    const prompt = `You are an expert music producer and harmony coach specializing in electronic dance music.

${songContext}
Target style: ${session.style}
Target BPM: ${session.bpm}
Desired feeling: ${session.feeling.join(', ') || 'not specified'}
${chordsContext}
${intentionContext}

Suggest a 4-chord progression that fits this context perfectly.

IMPORTANT: ${langInstruction}
Respond ONLY with valid JSON, no markdown, no extra text:
{
  "chords": ["Fmaj9", "Am11", "Bbmaj9", "C9sus4"],
  "explanation": "Two sentences explaining why this progression works for this style and feeling."
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
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${res.status} — ${err}`)
    }

    const data = await res.json() as { choices: { message: { content: string } }[] }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as {
      chords?: string[]
      explanation?: string
    }

    return new Response(
      JSON.stringify({
        chords: parsed.chords ?? [],
        explanation: parsed.explanation ?? '',
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar sugestão', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
}
