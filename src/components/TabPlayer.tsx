import { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { UnifiedPlayer } from './UnifiedPlayer'
import { parseProg } from '../core/parser'
import { genEvents } from '../core/groove'
import type { GenreDefinition, Extension, ViradasMode } from '../types'
import type { TabState, SuggestedProgression } from '../types/progressions'

interface Props {
  initialChords: string
  genre: GenreDefinition
  genreName: string
  bpm: number
  ext: Extension
  swing: number
  viradas: ViradasMode
}

export interface TabPlayerHandle {
  loadTab: (p: SuggestedProgression) => void
}

const MAX_TABS = 5

export const TabPlayer = forwardRef<TabPlayerHandle, Props>(function TabPlayer(
  { initialChords, genre, genreName, bpm, ext, swing, viradas },
  ref,
) {
  const [tabs, setTabs] = useState<TabState[]>([
    {
      id: 'tab-1',
      label: 'Principal',
      chords: initialChords.split(/\s+/).filter(Boolean),
      progressionName: 'Wizard',
    },
  ])
  const [activeTabId, setActiveTabId] = useState('tab-1')

  useEffect(() => {
    setTabs(prev =>
      prev.map(t =>
        t.id === 'tab-1'
          ? { ...t, chords: initialChords.split(/\s+/).filter(Boolean) }
          : t,
      ),
    )
  }, [initialChords])

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]!

  // Usa o groove da aba se disponível, caso contrário usa os parâmetros do App
  const g = activeTab.groove
  const effectiveGenre: GenreDefinition = g
    ? { ...genre, pianoSteps: g.pianoSteps, pianoDur: g.pianoDur, bassSteps: g.bassSteps, bassDur: g.bassDur }
    : genre
  const effectiveSwing = g?.swing ?? swing
  const effectiveViradas: ViradasMode = g?.viradas ?? viradas

  const activeChordText = activeTab.chords.join(' ')
  const { chords: parsedChords } = parseProg(activeChordText)
  const { pe, be } = genEvents(parsedChords, ext, effectiveGenre, effectiveSwing / 100, effectiveViradas)

  const loadTab = useCallback(
    (progression: SuggestedProgression) => {
      const id = `tab-${Date.now()}`
      const newTab: TabState = {
        id,
        label: progression.name.slice(0, 14),
        chords: progression.chords,
        progressionName: progression.name,
        groove: progression.groove,
      }
      setTabs(prev => {
        if (prev.length >= MAX_TABS) {
          const next = [...prev]
          next[next.length - 1] = newTab
          return next
        }
        return [...prev, newTab]
      })
      setActiveTabId(id)
    },
    [],
  )

  const closeTab = useCallback(
    (id: string) => {
      setTabs(prev => {
        const next = prev.filter(t => t.id !== id)
        if (activeTabId === id) setActiveTabId(next[next.length - 1]!.id)
        return next
      })
    },
    [activeTabId],
  )

  useImperativeHandle(ref, () => ({ loadTab }), [loadTab])

  return (
    <div className="space-y-0">
      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-1 px-1 pt-1">
          {tabs.map((tab, i) => (
            <div key={tab.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveTabId(tab.id)}
                className="font-mono text-xs px-3 py-1.5 rounded-t-lg transition-all"
                style={{
                  background: activeTabId === tab.id ? 'var(--color-card)' : 'var(--color-bg)',
                  color: activeTabId === tab.id ? 'var(--color-primary)' : 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                  borderBottom: activeTabId === tab.id ? '1px solid var(--color-card)' : undefined,
                  marginBottom: activeTabId === tab.id ? -1 : 0,
                }}
              >
                {i + 1}. {tab.label}
                {tab.groove && (
                  <span className="ml-1.5 opacity-60" style={{ fontSize: 9 }}>
                    ♩{tab.groove.swing}
                  </span>
                )}
              </button>
              {i > 0 && (
                <button
                  onClick={() => closeTab(tab.id)}
                  className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full -ml-1"
                  style={{ color: 'var(--color-muted)', background: 'var(--color-border)' }}
                  title="Fechar aba"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <UnifiedPlayer
        pianoEvents={pe}
        bassEvents={be}
        bpm={bpm}
        genre={effectiveGenre}
        genreName={genreName}
        chords={parsedChords}
        ext={ext}
      />
    </div>
  )
})
