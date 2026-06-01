interface Props {
  number: string
  title: string
}

export function SectionHeader({ number, title }: Props) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-mono text-xs text-accent tracking-widest">{number}</span>
      <h2 className="font-serif text-2xl font-normal text-ink">{title}</h2>
    </div>
  )
}
