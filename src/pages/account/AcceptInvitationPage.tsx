import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { useUrlToken } from '../../components/auth/useUrlToken'
import { accountApi, errorCode, type Invitation } from '../../services/accountApi'
import { translateError } from '../../i18n'

export function AcceptInvitationPage({ onAccepted }: { onAccepted: () => Promise<void> }) {
  const { t } = useTranslation('account')
  const token = useUrlToken()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [invalid, setInvalid] = useState(!token)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    accountApi.getInvitation(token)
      .then((value) => { setInvitation(value); setName(value.name ?? '') })
      .catch(() => setInvalid(true))
  }, [token])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return
    setSaving(true); setError('')
    try {
      await accountApi.acceptInvitation(token, password, name.trim() || undefined)
      await onAccepted()
    } catch (reason) {
      if (errorCode(reason) === 'TOKEN_INVALID') setInvalid(true)
      else setError(translateError(errorCode(reason), reason instanceof Error ? reason.message : undefined))
      setSaving(false)
    }
  }

  if (invalid) {
    return (
      <AuthLayout>
        <h2 className="font-display text-xl font-medium">{t('invitation.invalidTitle')}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{t('invitation.invalidBody')}</p>
        <p className="mt-6 text-center text-sm"><Link className="text-muted underline-offset-4 hover:text-fg hover:underline" to="/">{t('common.backToLogin')}</Link></p>
      </AuthLayout>
    )
  }

  if (!invitation) {
    return <AuthLayout><div className="flex items-center gap-3 text-sm text-muted" role="status"><span className="loader" /> {t('invitation.loading')}</div></AuthLayout>
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('invitation.title', { organization: invitation.organization_name })}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{t('invitation.subtitle', { email: invitation.email })}</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="block">
          <span className="field-label">{t('invitation.name')}</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
        </label>
        <PasswordField label={t('common.passwordLabel')} value={password} onChange={setPassword} autoComplete="new-password" hint={t('common.passwordHint')} minLength={8} />
        {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <button className="login-submit primary-button w-full" disabled={saving || password.length < 8}>
          {saving ? <span className="loader dark" /> : t('invitation.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
