// Vercel Edge Function — GET /api/search-songs?q=lionel+richie
// Usa iTunes Search API — gratuita, sem credenciais
export const config = { runtime: 'edge' }

interface ItunesTrack {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl60: string
  artworkUrl100: string
  trackTimeMillis: number
}

export default async function handler(req: Request) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()

  if (!q || q.length < 2) return new Response(JSON.stringify([]), { headers: cors })

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=6&country=BR&lang=pt_br`,
    )

    if (!res.ok) throw new Error(`iTunes error: ${res.status}`)

    const data = await res.json() as { results: ItunesTrack[] }

    const results = (data.results ?? []).map(t => ({
      id: String(t.trackId),
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      cover: t.artworkUrl60 ?? null,
      duration: Math.round((t.trackTimeMillis ?? 0) / 1000),
    }))

    return new Response(JSON.stringify(results), { headers: cors })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors })
  }
}
