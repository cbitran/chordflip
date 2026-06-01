import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/conta')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-outer-bg)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[3px] mb-2" style={{ color: 'var(--color-muted)' }}>
              Reharm Studio
            </div>
            <h1 className="font-sans text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
              {t('auth.loginTitle')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'var(--color-muted)' }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-neumorphic w-full px-4 py-3 text-sm"
                style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-widest block mb-2" style={{ color: 'var(--color-muted)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="input-neumorphic w-full pl-4 pr-11 py-3 text-sm"
                  style={{ color: 'var(--color-ink)', fontFamily: 'inherit' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--color-muted)' }}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(232,138,138,0.1)', color: '#e88a8a' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold rounded-xl mt-2 disabled:opacity-60"
            >
              {loading ? '...' : t('auth.loginBtn')}
            </button>
          </form>

          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>ou</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-card-hi)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-card)')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
          </div>

          <div className="mt-4 space-y-2 text-center">
            <Link to="/esqueci-senha" className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {t('auth.forgotPassword')}
            </Link>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {t('auth.noAccount')}{' '}
              <Link to="/cadastro" style={{ color: 'var(--color-primary)' }} className="font-semibold">
                {t('auth.registerLink')}
              </Link>
            </p>
            <Link to="/" className="block text-xs" style={{ color: 'var(--color-muted)' }}>
              {t('auth.orContinue')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
