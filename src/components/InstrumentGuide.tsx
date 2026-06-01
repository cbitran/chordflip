interface Props {
  genreName: string
  inst: Record<string, string>
}

export function InstrumentGuide({ genreName, inst }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
          Sugeridos para {genreName}
        </p>
      </div>
      {Object.entries(inst).map(([fn, tip], i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b last:border-0 transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="font-mono text-xs font-semibold w-20 shrink-0"
            style={{ color: 'var(--color-primary)' }}
          >
            {fn}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-ink)' }}>
            {tip}
          </div>
        </div>
      ))}
    </div>
  )
}
