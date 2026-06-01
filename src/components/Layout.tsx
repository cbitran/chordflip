import { useRef, useState } from 'react'
import { Sidebar } from './Sidebar'

interface Props {
  children: React.ReactNode
  sectionIds: string[]
}

export function Layout({ children, sectionIds }: Props) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const mainRef = useRef<HTMLDivElement>(null)

  const handleNav = (id: string) => {
    setActive(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleScroll = () => {
    if (!mainRef.current) return
    const scrollTop = mainRef.current.scrollTop + 120
    for (const id of [...sectionIds].reverse()) {
      const el = document.getElementById(id)
      if (el && el.offsetTop <= scrollTop) {
        setActive(id)
        break
      }
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: 'var(--color-outer-bg)' }}>
      <div
        className="flex h-screen overflow-hidden mx-auto"
        style={{
          maxWidth: 1440,
          background: 'var(--color-bg)',
          boxShadow: '0 0 80px rgba(0,0,0,0.15)',
        }}
      >
        <Sidebar active={active} onNav={handleNav} />
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-10 py-10 pb-20"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
