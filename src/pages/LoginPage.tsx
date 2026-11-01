import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { api } from '../services/api'
import type { Session } from '../types'
import { BrandMark } from '../components/BrandMark'
import { useTranslation } from 'react-i18next'

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation('auth')

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try { onLogin(await api.login(email, password)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('login.failed')) }
    finally { setLoading(false) }
  }

  return (
    <main className="login-grid login-screen min-h-screen overflow-hidden bg-ink text-fg">
      <section className="login-argument hidden lg:grid">
        <div className="login-brand">
          <BrandMark className="h-10 w-10" />
          <div>
            <div className="wordmark">Knowvault</div>
            <div className="text-xs text-muted">{t('login.tagline')}</div>
          </div>
        </div>

        <ConnectionDiagram />

        <div className="login-block">
          <h1 className="text-balance">{t('login.headline')}</h1>
          <p>{t('login.pitch')}</p>
          <div className="login-facts">
            <span>{t('login.facts.areas')}</span>
            <span>{t('login.facts.markdown')}</span>
            <span>{t('login.facts.history')}</span>
          </div>
        </div>
      </section>

      <section className="login-panel flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="login-form w-full max-w-sm">
          <div className="login-mobile-brand mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="h-11 w-11" />
            <div>
              <span className="wordmark block">Knowvault</span>
              <span className="text-xs text-muted">{t('login.tagline')}</span>
            </div>
          </div>
          <h2 className="font-display text-xl font-medium">{t('login.title')}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{t('login.subtitle')}</p>
          <form className="mt-9 space-y-5" onSubmit={submit}>
            <label className="block">
              <span className="field-label">{t('login.emailLabel')}</span>
              <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t('login.emailPlaceholder')} />
            </label>
            <label className="block">
              <span className="field-label">{t('login.passwordLabel')}</span>
              <span className="relative block">
                <input className="field pr-12" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder={t('login.passwordPlaceholder')} />
                <button type="button" className="password-toggle absolute right-1 top-1/2 grid -translate-y-1/2 place-items-center text-muted hover:text-fg" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>
            {error && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            <button className="login-submit primary-button group w-full" disabled={loading}>
              {loading ? <span className="loader dark" /> : <>{t('login.submit')} <ArrowRight size={17} /></>}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted">{t('login.secureNote')}</p>
        </div>
      </section>
    </main>
  )
}

/**
 * Fragmento de grafo, dibujado a mano. No es adorno: el titular habla de ver
 * cómo se conectan las ideas y esto es exactamente eso — tres áreas, sus notas
 * y los enlaces que las cruzan. El único nodo lleno es el acento de la pantalla.
 */
function ConnectionDiagram() {
  const hubs = [
    { x: 148, y: 132 },
    { x: 372, y: 252 },
    { x: 190, y: 398 },
  ]
  const notes = [
    { x: 58, y: 78, hub: 0 }, { x: 96, y: 208, hub: 0 },
    { x: 216, y: 54, hub: 0 }, { x: 246, y: 182, hub: 0 },
    { x: 452, y: 168, hub: 1 }, { x: 468, y: 326, hub: 1 },
    { x: 348, y: 118, hub: 1 }, { x: 396, y: 374, hub: 1 },
    { x: 86, y: 468, hub: 2 }, { x: 256, y: 484, hub: 2 },
    { x: 104, y: 334, hub: 2 }, { x: 282, y: 328, hub: 2 },
  ]
  // Enlaces que cruzan de un área a otra: lo que el producto hace visible.
  const crossLinks = [
    [3, 6], [3, 11], [1, 10], [11, 7], [4, 2], [9, 7], [0, 2],
  ] as const
  const focus = 3

  return (
    <svg className="login-diagram" viewBox="0 0 520 520" fill="none" aria-hidden="true">
      {notes.map((note, index) => (
        <line
          key={`m${index}`}
          x1={hubs[note.hub].x} y1={hubs[note.hub].y} x2={note.x} y2={note.y}
          stroke="var(--line)" strokeWidth="1"
        />
      ))}
      {crossLinks.map(([from, to]) => (
        <line
          key={`c${from}-${to}`}
          x1={notes[from].x} y1={notes[from].y} x2={notes[to].x} y2={notes[to].y}
          stroke="var(--control)" strokeWidth="1.25"
        />
      ))}
      {hubs.map((hub, index) => (
        <rect
          key={`h${index}`}
          x={hub.x - 12} y={hub.y - 12} width="24" height="24" rx="6"
          fill="var(--panel)" stroke="var(--fg-2)" strokeWidth="1"
        />
      ))}
      {notes.map((note, index) => (
        <circle
          key={`n${index}`}
          cx={note.x} cy={note.y} r={index === focus ? 7 : 5}
          fill={index === focus ? 'var(--accent)' : 'var(--ink)'}
          stroke={index === focus ? 'var(--accent)' : 'var(--control)'}
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
