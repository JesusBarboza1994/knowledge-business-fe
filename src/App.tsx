import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoginPage } from './components/LoginPage'
import { Workspace } from './components/Workspace'
import { api } from './services/api'
import type { Session } from './types'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  const areas = useQuery({ queryKey: ['areas'], queryFn: api.getAreas, enabled: Boolean(session) })
  const notes = useQuery({ queryKey: ['notes'], queryFn: api.getNotes, enabled: Boolean(session) })
  const members = useQuery({ queryKey: ['members'], queryFn: api.getMembers, enabled: Boolean(session) && session?.role !== 'member' })

  useEffect(() => {
    void api.getSession().then(setSession).catch(() => setSession(null))
  }, [])

  if (session === undefined) {
    return <div className="grid min-h-screen place-items-center bg-ink text-stone-200"><div className="flex items-center gap-3 text-sm text-muted"><span className="loader" /> Verificando sesión…</div></div>
  }

  if (!session) return <LoginPage onLogin={setSession} />

  if (areas.isLoading || notes.isLoading || members.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink text-stone-200">
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
      onLogout={() => { void api.logout().finally(() => setSession(null)) }}
    />
  )
}
