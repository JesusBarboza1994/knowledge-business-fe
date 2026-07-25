import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Workspace } from './components/Workspace'
import { api } from './services/api'
import type { Session } from './types'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const queryClient = useQueryClient()

  const scope = session?.userId
  const areas = useQuery({ queryKey: ['areas', scope], queryFn: api.getAreas, enabled: Boolean(session) })
  const notes = useQuery({ queryKey: ['notes', scope], queryFn: api.getNotes, enabled: Boolean(session) })
  const members = useQuery({ queryKey: ['members', scope], queryFn: api.getMembers, enabled: Boolean(session) && session?.role !== 'member' })

  function startSession(next: Session) {
    queryClient.clear()
    setSession(next)
  }

  useEffect(() => {
    void api.getSession().then(setSession).catch(() => setSession(null))
  }, [])

  if (session === undefined) {
    return <div className="grid min-h-screen place-items-center bg-ink text-fg"><div className="flex items-center gap-3 text-sm text-muted"><span className="loader" /> Verificando sesión…</div></div>
  }

  if (!session) return <LoginPage onLogin={startSession} />

  if (areas.isLoading || notes.isLoading || members.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-fg">
        <div className="flex items-center gap-3 text-sm text-muted"><span className="loader" /> Preparando tu conocimiento…</div>
      </div>
    )
  }

  return (
    <Workspace
      session={session}
      initialAreas={areas.data ?? []}
      initialNotes={notes.data ?? []}
      initialMembers={members.data ?? []}
      onLogout={() => { void api.logout().finally(() => { queryClient.clear(); setSession(null) }) }}
    />
  )
}
