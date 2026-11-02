import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ResendButton } from '../../components/auth/ResendButton'
import { useUrlToken } from '../../components/auth/useUrlToken'
import { accountApi } from '../../services/accountApi'

/** Confirma el email y, como el backend abre la sesión, entrega el control a la app. */
export function VerifyEmailPage({ onVerified }: { onVerified: () => Promise<void> }) {
  const { t } = useTranslation('account')
  const token = useUrlToken()
  const [failed, setFailed] = useState(!token)
  const [email, setEmail] = useState('')
  // StrictMode monta dos veces en desarrollo: el token es de un solo uso y el segundo intento fallaría.
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    accountApi.verifyEmail(token).then(onVerified).catch(() => setFailed(true))
  }, [token, onVerified])

  if (!failed) {
    return <AuthLayout><div className="flex items-center gap-3 text-sm text-muted" role="status"><span className="loader" /> {t('verify.verifying')}</div></AuthLayout>
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('verify.failedTitle')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{t('verify.failedBody')}</p>
      <label className="mt-6 block">
        <span className="field-label">{t('common.emailLabel')}</span>
        <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.emailPlaceholder')} autoComplete="email" />
      </label>
      <div className="mt-4">{email.includes('@') && <ResendButton onResend={() => accountApi.resendVerification(email.trim())} />}</div>
      <p className="mt-6 text-center text-sm"><Link className="text-muted underline-offset-4 hover:text-fg hover:underline" to="/">{t('common.backToLogin')}</Link></p>
    </AuthLayout>
  )
}
