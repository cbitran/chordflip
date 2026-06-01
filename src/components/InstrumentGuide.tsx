interface Props {
  genreName: string
  inst: Record<string, string>
}

export function InstrumentGuide({ genreName, inst }: Props) {
  return (
    <div>
      <p className="font-mono text-xs text-muted mb-3">Instrumentos sugeridos · {genreName}</p>
      <div className="rounded-xl overflow-hidden border border-white/6">
        {Object.entries(inst).map(([fn, tip], i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 bg-panel border-b border-white/4 last:border-0"
          >
            <div className="font-mono text-xs font-medium text-accent w-20 shrink-0">{fn}</div>
            <div className="text-sm text-ink">{tip}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
