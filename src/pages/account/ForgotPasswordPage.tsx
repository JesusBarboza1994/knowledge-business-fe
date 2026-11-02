import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ResendButton } from '../../components/auth/ResendButton'
import { accountApi } from '../../services/accountApi'

export function ForgotPasswordPage() {
  const { t } = useTranslation('account')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value.includes('@')) return
    setSending(true)
    // La respuesta es la misma exista o no la cuenta: no hay error que mostrar salvo fallas de red.
    try { await accountApi.forgotPassword(value) } catch { /* se muestra el mismo mensaje */ }
    finally { setSending(false); setSentTo(value) }
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <h2 className="font-display text-xl font-medium">{t('forgot.sentTitle')}</h2>
        <p className="mt-3 text-sm leading-6 text-fg-2"><Trans t={t} i18nKey="forgot.sentBody" values={{ email: sentTo }} components={{ strong: <strong className="text-fg" /> }} /></p>
        <div className="mt-6"><ResendButton onResend={() => accountApi.forgotPassword(sentTo)} startCoolingDown /></div>
        <p className="mt-6 text-center text-sm"><Link className="text-muted underline-offset-4 hover:text-fg hover:underline" to="/">{t('common.backToLogin')}</Link></p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('forgot.title')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{t('forgot.subtitle')}</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="block">
          <span className="field-label">{t('common.emailLabel')}</span>
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.emailPlaceholder')} autoComplete="email" autoFocus />
        </label>
        <button className="login-submit primary-button w-full" disabled={sending || !email.includes('@')}>
          {sending ? <span className="loader dark" /> : t('forgot.submit')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm"><Link className="text-muted underline-offset-4 hover:text-fg hover:underline" to="/">{t('common.backToLogin')}</Link></p>
    </AuthLayout>
  )
}
