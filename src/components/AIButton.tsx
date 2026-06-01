import { useAI } from '../contexts/AIContext'
import { useTranslation } from 'react-i18next'

export function AIButton() {
  const { t } = useTranslation()
  const { status, callAI } = useAI()

  const isLoading = status === 'loading'
  const isActive = status === 'active'

  return (
    <button
      onClick={callAI}
      disabled={isLoading}
      className="btn-neumorphic px-3 py-1.5 text-xs font-mono rounded-xl flex items-center gap-1.5 transition-all"
      style={{
        color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
        borderColor: isActive ? 'var(--color-primary)' : undefined,
        opacity: isLoading ? 0.7 : 1,
      }}
      title={isActive ? t('ai.active') : t('ai.callButton')}
    >
      {isLoading ? (
        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span
          className={isActive ? 'animate-pulse' : ''}
          style={{ fontSize: '12px', lineHeight: 1 }}
        >
          ✦
        </span>
      )}
      <span className="hidden sm:inline">
        {isLoading ? t('ai.thinking') : isActive ? t('ai.active') : t('ai.callButton')}
      </span>
    </button>
  )
}
