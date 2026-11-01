import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import type { Session } from '../types'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordField } from '../components/auth/PasswordField'
import { ResendButton } from '../components/auth/ResendButton'
import { accountApi } from '../services/accountApi'

/** `httpApi` no expone el código de negocio; el 403 del login solo ocurre por email sin verificar. */
function isUnverified(reason: unknown): boolean {
  return typeof reason === 'object' && reason !== null && (reason as { status?: unknown }).status === 403
}

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const { t } = useTranslation('auth')
  const { t: ta } = useTranslation('account')

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(''); setUnverified(false)
    try { onLogin(await api.login(email, password)) }
    catch (reason) {
      if (isUnverified(reason)) setUnverified(true)
      else setError(reason instanceof Error ? reason.message : t('login.failed'))
    }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('login.title')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{t('login.subtitle')}</p>
      <form className="mt-9 space-y-5" onSubmit={submit}>
        <label className="block">
          <span className="field-label">{t('login.emailLabel')}</span>
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t('login.emailPlaceholder')} />
        </label>
        <PasswordField label={t('login.passwordLabel')} value={password} onChange={setPassword} autoComplete="current-password" placeholder={t('login.passwordPlaceholder')} />
        <div className="-mt-2 text-right"><Link className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline" to="/recuperar-contrasena">{ta('login.forgot')}</Link></div>
        {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        {unverified && (
          <div className="space-y-3 rounded-md border border-warn/25 bg-warn/10 px-3 py-3 text-sm text-warn">
            <p>{ta('login.notVerified')}</p>
            <ResendButton onResend={() => accountApi.resendVerification(email)} />
          </div>
        )}
        <button className="login-submit primary-button group w-full" disabled={loading}>
          {loading ? <span className="loader dark" /> : <>{t('login.submit')} <ArrowRight size={17} /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {ta('login.noAccount')} <Link className="font-medium text-accent underline-offset-4 hover:underline" to="/registro">{ta('login.createAccount')}</Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">{t('login.secureNote')}</p>
    </AuthLayout>
  )
}
