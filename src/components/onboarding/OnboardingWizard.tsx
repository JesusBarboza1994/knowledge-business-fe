import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, MailPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BrandMark } from '../BrandMark'
import { ConnectClaude } from '../connect/ConnectClaude'
import { api } from '../../services/api'
import { inviteApi, organizationApi } from '../../services/accountApi'
import { slugify } from '../../lib/slug'
import type { AccessLevel, Area, Sensitivity, Session } from '../../types'

type Step = 1 | 2 | 3
const TOTAL_STEPS = 3

interface Props {
  session: Session
  areas: Area[]
  onFinish: () => void
}

/** Recordar el paso es una comodidad: si el almacenamiento falla, se deduce de los datos. */
function storedStep(tenant: string): Step | undefined {
  try {
    const value = Number(window.localStorage.getItem(`onboarding-step:${tenant}`))
    return value === 2 || value === 3 ? value : undefined
  } catch {
    return undefined
  }
}

function rememberStep(tenant: string, step: Step) {
  try { window.localStorage.setItem(`onboarding-step:${tenant}`, String(step)) } catch { /* sin almacenamiento */ }
}

/**
 * Asistente para el admin de una organización recién registrada: primera área (obligatoria),
 * invitar al equipo (opcional) y conectar Claude. Se muestra hasta que se termina.
 */
export function OnboardingWizard({ session, areas: initialAreas, onFinish }: Props) {
  const { t } = useTranslation('onboarding')
  const { t: tc } = useTranslation('common')
  const [areas, setAreas] = useState(initialAreas)
  const [step, setStepState] = useState<Step>(() => {
    if (!initialAreas.length) return 1
    return storedStep(session.tenant) ?? 2
  })
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState('')

  function setStep(next: Step) {
    rememberStep(session.tenant, next)
    setStepState(next)
  }

  async function finish() {
    setFinishing(true); setFinishError('')
    try {
      await organizationApi.completeOnboarding()
      onFinish()
    } catch (reason) {
      setFinishError(reason instanceof Error ? reason.message : String(reason))
      setFinishing(false)
    }
  }

  const titles: Record<Step, string> = { 1: t('area.title'), 2: t('invite.title'), 3: tc('connectClaude') }

  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-fg sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <div>
            <p className="text-xs text-muted">{t('welcome', { product: tc('productName') })}</p>
            <p className="text-sm font-medium">{session.organizationName}</p>
          </div>
        </div>

        <div className="mt-8" aria-label={t('progress', { current: step, total: TOTAL_STEPS })}>
          <p className="eyebrow">{t('progress', { current: step, total: TOTAL_STEPS })}</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((item) => <span key={item} className={`h-1 rounded-full ${item <= step ? 'bg-accent' : 'bg-line'}`} />)}
          </div>
          <h1 className="mt-5 font-display text-2xl font-medium">{titles[step]}</h1>
        </div>

        <section className="surface-card mt-6 p-5 sm:p-6">
          {step === 1 && (
            <AreaStep onCreated={(area) => { setAreas((current) => [...current, area]); setStep(2) }} />
          )}
          {step === 2 && (
            <InviteStep area={areas[0]} onNext={() => setStep(3)} />
          )}
          {step === 3 && (
            <div className="space-y-6">
              <ConnectClaude compact />
              {finishError && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{finishError}</p>}
              <div className="flex flex-wrap justify-between gap-3">
                <button type="button" className="secondary-button" onClick={() => setStep(2)}>{t('back')}</button>
                <button type="button" className="primary-button" onClick={() => void finish()} disabled={finishing}>
                  {finishing ? <span className="loader dark small" /> : <>{t('finish')} <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function AreaStep({ onCreated }: { onCreated: (area: Area) => void }) {
  const { t } = useTranslation('onboarding')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sensitivity, setSensitivity] = useState<Sensitivity>('public_org')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const key = slugify(name)
  const canSubmit = name.trim().length >= 2 && key.length >= 2 && !saving

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSaving(true); setError('')
    try {
      onCreated(await api.createArea({ key, name: name.trim(), description: description.trim(), defaultSensitivity: sensitivity }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <p className="text-sm leading-6 text-muted">{t('area.body')}</p>
      <label className="block">
        <span className="field-label">{t('area.name')}</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('area.namePlaceholder')} maxLength={100} autoFocus />
      </label>
      <label className="block">
        <span className="field-label">{t('area.description')}</span>
        <input className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('area.descriptionPlaceholder')} maxLength={280} />
      </label>
      <label className="block">
        <span className="field-label">{t('area.sensitivity')}</span>
        <select className="field" value={sensitivity} onChange={(e) => setSensitivity(e.target.value as Sensitivity)}>
          {(['public_org', 'internal_area', 'confidential'] as const).map((value) => <option key={value} value={value}>{t(`area.sensitivityOptions.${value}`)}</option>)}
        </select>
      </label>
      {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
      <div className="flex justify-end">
        <button className="primary-button" disabled={!canSubmit}>
          {saving ? <span className="loader dark small" /> : <>{t('area.submit')} <ArrowRight size={16} /></>}
        </button>
      </div>
    </form>
  )
}

function InviteStep({ area, onNext }: { area?: Area; onNext: () => void }) {
  const { t } = useTranslation('onboarding')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState<AccessLevel>('write')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<Array<{ email: string; delivered: boolean }>>([])
  const canSubmit = name.trim().length >= 2 && email.includes('@') && !sending

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSending(true); setError('')
    const address = email.trim().toLowerCase()
    try {
      const result = await inviteApi.invite({
        email: address,
        name: name.trim(),
        role: 'member',
        memberships: area ? [{ area: area.key, access }] : [],
      })
      setSent((current) => [...current, { email: address, delivered: result.invitation_sent }])
      setName(''); setEmail('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-muted">{t('invite.body')}</p>
      {sent.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {sent.map((item) => (
            <li key={item.email} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${item.delivered ? 'border-line text-fg-2' : 'border-warn/25 bg-warn/10 text-warn'}`}>
              {item.delivered ? <Check size={14} className="mt-0.5 shrink-0 text-accent" /> : <MailPlus size={14} className="mt-0.5 shrink-0" />}
              {item.delivered ? t('invite.sent', { email: item.email }) : t('invite.notSent', { email: item.email })}
            </li>
          ))}
        </ul>
      )}
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t('invite.name')}</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={120} />
          </label>
          <label className="block">
            <span className="field-label">{t('invite.email')}</span>
            <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </label>
        </div>
        {area && (
          <label className="block">
            <span className="field-label">{t('invite.access', { area: area.name })}</span>
            <select className="field" value={access} onChange={(e) => setAccess(e.target.value as AccessLevel)}>
              {(['read', 'write', 'manage'] as const).map((value) => <option key={value} value={value}>{t(`invite.accessOptions.${value}`)}</option>)}
            </select>
          </label>
        )}
        {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <button className="secondary-button w-full" disabled={!canSubmit}>
          {sending ? <span className="loader small" /> : <><MailPlus size={15} /> {t('invite.add')}</>}
        </button>
      </form>
      <div className="flex justify-end border-t border-line pt-5">
        <button type="button" className="primary-button" onClick={onNext}>
          {sent.length ? t('next') : t('skip')} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
