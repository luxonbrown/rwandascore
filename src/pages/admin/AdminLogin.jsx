import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const demoAccounts = [
  { key: 'admin.demoAdmin', email: 'admin@rwandascore.rw', password: 'admin123' },
  { key: 'admin.demoEditor', email: 'alice@rwandascore.rw', password: 'editor123' },
]

export default function AdminLogin() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.loginTitle'))
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn)
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (loginError) {
      setError(loginError?.status === 401 ? t('admin.invalid') : loginError.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-white"
        >
          <ArrowLeft size={15} />
          {t('admin.viewSite')}
        </Link>

        <div className="card overflow-hidden">
          <div className="border-b border-line bg-gradient-to-br from-accent/15 via-surface to-surface px-6 py-7">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-lg font-black text-ink">
              R
            </span>
            <h1 className="text-2xl font-extrabold text-white">{t('admin.loginTitle')}</h1>
            <p className="mt-1.5 text-sm text-muted">{t('admin.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2.5 text-xs font-medium text-negative"
              >
                {error}
              </p>
            ) : null}

            <div>
              <label htmlFor="admin-email" className="label">
                {t('admin.email')}
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
                placeholder="you@rwandascore.rw"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="label">
                {t('admin.password')}
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t('settings.hide') : t('settings.show')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-accent w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LockKeyhole size={16} />
              )}
              {isLoggingIn ? t('admin.signingIn') : t('admin.signIn')}
            </button>
          </form>

          <div className="border-t border-line bg-surface2/50 px-6 py-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
              <ShieldCheck size={14} className="text-accent" />
              {t('admin.hint')}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                    setError('')
                  }}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-accent/50 hover:bg-hover"
                >
                  <span className="block font-bold text-white">{t(account.key)}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('admin.loginHint')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
