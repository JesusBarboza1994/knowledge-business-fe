import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { PasswordField } from '../../components/auth/PasswordField'
import { ResendButton } from '../../components/auth/ResendButton'
import { accountApi, errorCode, type SignupResult, type SlugAvailability } from '../../services/accountApi'
import { COUNTRY_CODES, defaultCountry } from '../../data/countryCodes'
import { useDebounced } from '../../lib/useDebounced'
import { slugify } from '../../lib/slug'
import { translateError } from '../../i18n'

const PASSWORD_MIN = 8

export function RegisterPage() {
  const { t } = useTranslation('account')
  const [organizationName, setOrganizationName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [countryIso, setCountryIso] = useState(() => defaultCountry().iso)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SignupResult | null>(null)

  const effectiveSlug = slugEdited ? slug : slugify(organizationName)
  const debouncedSlug = useDebounced(effectiveSlug, 350)
  const [availability, setAvailability] = useState<SlugAvailability | null>(null)

  useEffect(() => {
    if (!debouncedSlug) { setAvailability(null); return }
    let cancelled = false
    accountApi.checkSlug(debouncedSlug)
      .then((value) => { if (!cancelled) setAvailability(value) })
      .catch(() => { if (!cancelled) setAvailability(null) })
    return () => { cancelled = true }
  }, [debouncedSlug])

  const slugState = !effectiveSlug ? null
    : debouncedSlug !== effectiveSlug || availability?.slug !== effectiveSlug ? 'checking'
    : availability.available ? 'available' : availability.reason ?? 'taken'

  const country = COUNTRY_CODES.find((item) => item.iso === countryIso) ?? COUNTRY_CODES[0]
  const canSubmit = organizationName.trim().length >= 2 && slugState === 'available' && description.trim().length >= 3
    && /^[0-9][0-9 -]{4,18}[0-9]$/.test(phone.trim()) && name.trim().length >= 2 && email.includes('@')
    && password.length >= PASSWORD_MIN && !submitting

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true); setError('')
    try {
      setResult(await accountApi.signup({
        organization_name: organizationName.trim(),
        slug: effectiveSlug,
        description: description.trim(),
        phone_country_code: country.dial,
        phone_number: phone.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }))
    } catch (reason) {
      setError(translateError(errorCode(reason), reason instanceof Error ? reason.message : undefined))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) return <CheckEmail result={result} />

  return (
    <AuthLayout wide>
      <p className="eyebrow">{t('signup.eyebrow')}</p>
      <h2 className="mt-1 font-display text-xl font-medium">{t('signup.title')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{t('signup.subtitle')}</p>
      <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-medium uppercase tracking-label text-muted">{t('signup.sectionCompany')}</legend>
          <label className="block">
            <span className="field-label">{t('signup.organizationName')}</span>
            <input className="field" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder={t('signup.organizationNamePlaceholder')} autoComplete="organization" maxLength={100} />
          </label>
          <div>
            <label className="block">
              <span className="field-label">{t('signup.slug')}</span>
              <input className="field font-mono" value={effectiveSlug} onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)) }} spellCheck={false} maxLength={40} aria-describedby="slug-status" />
            </label>
            <p id="slug-status" className="mt-1.5 flex items-center gap-1.5 text-xs" aria-live="polite">
              {slugState === 'checking' && <span className="text-muted">{t('signup.slugChecking')}</span>}
              {slugState === 'available' && <span className="flex items-center gap-1 text-accent"><Check size={13} /> {t('signup.slugAvailable')}</span>}
              {slugState === 'taken' && <span className="flex items-center gap-1 text-danger"><X size={13} /> {t('signup.slugTaken')}</span>}
              {slugState === 'reserved' && <span className="flex items-center gap-1 text-danger"><X size={13} /> {t('signup.slugReserved')}</span>}
              {slugState === 'invalid' && <span className="flex items-center gap-1 text-danger"><X size={13} /> {t('signup.slugInvalid')}</span>}
              {!slugState && <span className="text-muted">{t('signup.slugHelp')}</span>}
            </p>
          </div>
          <label className="block">
            <span className="field-label">{t('signup.description')}</span>
            <input className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('signup.descriptionPlaceholder')} maxLength={280} />
          </label>
          <div>
            <span className="field-label" id="phone-label">{t('signup.phone')}</span>
            <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-2" role="group" aria-labelledby="phone-label">
              <select className="field" value={countryIso} onChange={(e) => setCountryIso(e.target.value)} aria-label={t('signup.phoneCountry')}>
                {COUNTRY_CODES.map((item) => <option key={item.iso} value={item.iso}>{item.dial} {item.name}</option>)}
              </select>
              <input className="field" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('signup.phonePlaceholder')} autoComplete="tel-national" maxLength={20} aria-labelledby="phone-label" />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="mb-3 pt-5 text-xs font-medium uppercase tracking-label text-muted">{t('signup.sectionAdmin')}</legend>
          <label className="block">
            <span className="field-label">{t('signup.name')}</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('signup.namePlaceholder')} autoComplete="name" maxLength={120} />
          </label>
          <label className="block">
            <span className="field-label">{t('common.emailLabel')}</span>
            <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('common.emailPlaceholder')} autoComplete="email" />
          </label>
          <PasswordField label={t('common.passwordLabel')} value={password} onChange={setPassword} autoComplete="new-password" hint={t('common.passwordHint')} minLength={PASSWORD_MIN} />
        </fieldset>

        {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <p className="text-xs text-muted">{t('signup.limits')}</p>
        <button className="login-submit primary-button w-full" disabled={!canSubmit}>
          {submitting ? <span className="loader dark" /> : <>{t('signup.submit')} <ArrowRight size={17} /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('signup.haveAccount')} <Link className="font-medium text-accent underline-offset-4 hover:underline" to="/">{t('signup.login')}</Link>
      </p>
    </AuthLayout>
  )
}

function CheckEmail({ result }: { result: SignupResult }) {
  const { t } = useTranslation('account')
  return (
    <AuthLayout>
      <h2 className="font-display text-xl font-medium">{t('checkEmail.title')}</h2>
      <p className="mt-3 text-sm leading-6 text-fg-2">
        <Trans t={t} i18nKey="checkEmail.body" values={{ email: result.email }} components={{ strong: <strong className="text-fg" /> }} />
      </p>
      {!result.verification_sent && <p className="mt-4 rounded-md border border-warn/25 bg-warn/10 px-3 py-2 text-sm text-warn">{t('checkEmail.notSent')}</p>}
      <p className="mt-4 text-sm text-muted">{t('checkEmail.spam')}</p>
      <div className="mt-6"><ResendButton onResend={() => accountApi.resendVerification(result.email)} startCoolingDown={result.verification_sent} /></div>
      <p className="mt-6 text-center text-sm"><Link className="text-muted underline-offset-4 hover:text-fg hover:underline" to="/">{t('common.backToLogin')}</Link></p>
    </AuthLayout>
  )
}
