import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Workspace } from './components/Workspace'
import { api } from './services/api'
import type { Session } from './types'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/account/RegisterPage'
import { VerifyEmailPage } from './pages/account/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/account/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/account/ResetPasswordPage'
import { AcceptInvitationPage } from './pages/account/AcceptInvitationPage'
import { ConnectClaudePage } from './pages/ConnectClaudePage'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { organizationApi } from './services/accountApi'
import { useTranslation } from 'react-i18next'

/**
 * Las rutas de cuenta son públicas y no esperan a la verificación de sesión. Las rutas deben
 * coincidir con ACCOUNT_LINK_PATHS del backend (enlaces de los correos).
 */
export default function App() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  const startSession = useCallback((next: Session) => {
    queryClient.clear()
    setSession(next)
  }, [queryClient])

  /** Tras un enlace que abre sesión en el backend (verificar email, aceptar invitación). */
  const enterApp = useCallback(async () => {
    startSession(await api.getSession())
    navigate('/', { replace: true })
  }, [navigate, startSession])

  useEffect(() => {
    // Si un enlace por correo ya abrió sesión mientras esto viajaba, no la pisamos.
    const settle = (value: Session | null) => setSession((current) => (current === undefined ? value : current))
    void api.getSession().then(settle).catch(() => settle(null))
  }, [])

  return (
    <Routes>
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/verificar-email" element={<VerifyEmailPage onVerified={enterApp} />} />
      <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/invitacion" element={<AcceptInvitationPage onAccepted={enterApp} />} />
      <Route path="*" element={<SessionGate session={session} onLogin={startSession} onLogout={() => setSession(null)} />} />
    </Routes>
  )
}

function SessionGate({ session, onLogin, onLogout }: {
  session: Session | null | undefined
  onLogin: (session: Session) => void
  onLogout: () => void
}) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const scope = session?.userId
  const areas = useQuery({ queryKey: ['areas', scope], queryFn: api.getAreas, enabled: Boolean(session) })
  const notes = useQuery({ queryKey: ['notes', scope], queryFn: api.getNotes, enabled: Boolean(session) })
  const members = useQuery({ queryKey: ['members', scope], queryFn: api.getMembers, enabled: Boolean(session) && session?.role !== 'member' })
  const isAdmin = session?.role === 'admin' || session?.role === 'superadmin'
  // Solo los admins necesitan saber si el asistente está pendiente; un fallo aquí nunca bloquea la app.
  const organization = useQuery({ queryKey: ['organization', scope], queryFn: organizationApi.current, enabled: isAdmin })
  const location = useLocation()

  if (session === undefined) {
    return <div className="grid min-h-screen place-items-center bg-ink text-fg"><div className="flex items-center gap-3 text-sm text-muted"><span className="loader" /> {t('loading.session')}</div></div>
  }

  if (!session) return <LoginPage onLogin={onLogin} />

  if (areas.isLoading || notes.isLoading || members.isLoading || organization.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-fg">
        <div className="flex items-center gap-3 text-sm text-muted"><span className="loader" /> {t('loading.workspace')}</div>
      </div>
    )
  }

  if (isAdmin && organization.data?.onboarding_completed_at === null) {
    return (
      <OnboardingWizard
        session={session}
        areas={areas.data ?? []}
        onFinish={() => { void queryClient.invalidateQueries() }}
      />
    )
  }

  if (location.pathname === '/conectar-claude') return <ConnectClaudePage />

  return (
    <Workspace
      session={session}
      initialAreas={areas.data ?? []}
      initialNotes={notes.data ?? []}
      initialMembers={members.data ?? []}
      onLogout={() => { void api.logout().finally(() => { queryClient.clear(); onLogout() }) }}
    />
  )
}
