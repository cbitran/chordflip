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

function SongSearchInput({ onSelect }: { onSelect: (song: SongOption) => void }) {
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
        placeholder="Ex: The Weeknd — Blinding Lights"
        className="input-neumorphic w-full pl-4 pr-8 py-3 text-sm"
        style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
        autoFocus
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-spin" style={{ color: 'var(--color-muted)' }}>◌</span>
      )}
      {selected && (
        <button onClick={() => { setSelected(null); setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-muted)' }}>✕</button>
      )}
      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}
        >
          {results.slice(0, 5).map(s => (
            <button
              key={s.id}
              onClick={() => handlePick(s)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-0 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-card-hi)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s.cover
                ? <img src={s.cover} alt="" className="w-8 h-8 rounded-lg shrink-0 object-cover" />
                : <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base" style={{ background: 'var(--color-bg)' }}>🎵</div>
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
    } catch {
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
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-sans text-3xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>ChordFlip</h1>
          <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
            transforme qualquer música em MIDI pronto pro Ableton
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i <= step ? 'var(--color-primary)' : 'var(--color-border)' }}
            />
          ))}
        </div>

        <div className="card p-8">

          {/* Passo 0: Música */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                Qual música você quer remixar?
              </p>
              <SongSearchInput onSelect={s => { setSong(s); setStep(1) }} />
            </div>
          )}

          {/* Passo 1: Estilo */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                Qual o estilo do remix?
              </p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${style === s ? 'btn-primary' : 'btn-neumorphic'}`}
                    style={style !== s ? { color: 'var(--color-ink)' } : {}}
                  >
                    {s}
                  </button>
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
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                Qual o BPM?
              </p>
              <input
                type="range"
                min={60}
                max={180}
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                <span>60</span>
                <span className="font-bold text-xl" style={{ color: 'var(--color-ink)' }}>{bpm} BPM</span>
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
              <p className="font-sans text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                Qual o feeling?{' '}
                <span className="text-sm font-normal" style={{ color: 'var(--color-muted)' }}>(opcional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {FEELINGS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFeeling(f.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${feeling.includes(f.id) ? 'btn-primary' : 'btn-neumorphic'}`}
                    style={!feeling.includes(f.id) ? { color: 'var(--color-muted)' } : {}}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(232,138,138,0.1)', color: '#e88a8a' }}>
                  {error}
                </p>
              )}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="text-xs" style={{ color: 'var(--color-muted)' }}>← Voltar</button>
                <button
                  onClick={handleGenerate}
                  className="btn-primary px-6 py-2.5 text-sm rounded-xl font-semibold"
                >
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
