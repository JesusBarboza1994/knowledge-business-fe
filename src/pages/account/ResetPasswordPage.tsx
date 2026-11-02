import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { useUrlToken } from '../../components/auth/useUrlToken'
import { accountApi, errorCode } from '../../services/accountApi'
import { translateError } from '../../i18n'

export function ResetPasswordPage() {
  const { t } = useTranslation('account')
  const token = useUrlToken()
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<'form' | 'done' | 'invalid'>(token ? 'form' : 'invalid')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return
    setSaving(true); setError('')
    try {
      await accountApi.resetPassword(token, password)
      setState('done')
    } catch (reason) {
      if (errorCode(reason) === 'TOKEN_INVALID') setState('invalid')
      else setError(translateError(errorCode(reason), reason instanceof Error ? reason.message : undefined))
    } finally {
      setSaving(false)
    }
  }

  if (state !== 'form') {
    const done = state === 'done'
    return (
      <AuthLayout>
        <h2 className="font-display text-xl font-medium">{done ? t('reset.doneTitle') : t('reset.invalidTitle')}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{done ? t('reset.doneBody') : t('reset.invalidBody')}</p>
        <Link className="login-submit primary-button mt-8 w-full" to={done ? '/' : '/recuperar-contrasena'}>{done ? t('common.backToLogin') : t('reset.requestNew')}</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('reset.title')}</h2>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <PasswordField label={t('common.newPasswordLabel')} value={password} onChange={setPassword} autoComplete="new-password" hint={t('common.passwordHint')} minLength={8} />
        {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <button className="login-submit primary-button w-full" disabled={saving || password.length < 8}>
          {saving ? <span className="loader dark" /> : t('reset.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
