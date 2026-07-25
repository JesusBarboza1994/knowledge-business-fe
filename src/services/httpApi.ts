import type { AccessLevel, Area, DeleteNoteResult, Member, Note, NoteVersion, Sensitivity, Session } from '../types'

const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:3000/v1' : '/api/v1'
const API_URL = (import.meta.env.VITE_API_URL ?? defaultApiUrl).replace(/\/$/, '')

class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) { super(message) }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  const payload = await response.json().catch(() => null) as { data?: T; message?: string; details?: unknown } | null
  if (!response.ok) throw new ApiError(payload?.message ?? `HTTP ${response.status}`, response.status, payload?.details)
  return payload?.data as T
}

type ContextResponse = {
  organization: { slug: string; name: string }
  user: { id: string; email: string; name?: string; role: 'member' | 'admin' | 'superadmin'; tenant: string }
  areas: Array<{ key: string; name: string; description?: string; access: AccessLevel; default_sensitivity?: Sensitivity; note_count: number }>
}

type RawNote = {
  id?: string; _id?: string; area: string; slug: string; title: string; kind?: Note['kind']; body?: string
  aliases?: string[]
  sensitivity: Note['sensitivity']; visible_to?: string[]; version: number; updated_at?: string; updated_by?: string
  outlinks?: Array<{
    display: string; target_id?: string | null; target_slug?: string | null; target_title?: string
    target_area?: string; access?: 'accessible' | 'restricted' | 'missing'
  }>
  unresolved?: Array<{ name: string }>
}

type NotesPage = { items: RawNote[]; total: number; limit: number; truncated: boolean }

type RawMember = {
  _id: string; name?: string; email: string; role: 'member' | 'admin' | 'superadmin'; status: 'active' | 'invited' | 'inactive'
  memberships?: Array<{ area: string; access: AccessLevel }>
}

const colors = ['#b7e66b', '#76b7ff', '#e9a86f', '#c49af1', '#6dd6c8', '#ef8da1']

function mapContext(context: ContextResponse): { session: Session; areas: Area[] } {
  return {
    session: {
      userId: context.user.id,
      email: context.user.email,
      name: context.user.name ?? context.user.email.split('@')[0],
      tenant: context.user.tenant,
      organizationName: context.organization.name,
      role: context.user.role === 'member' ? 'member' : 'admin',
    },
    areas: context.areas.map((area, index) => ({
      key: area.key, name: area.name, description: area.description ?? '', access: area.access,
      noteCount: area.note_count, color: colors[index % colors.length],
      defaultSensitivity: area.default_sensitivity ?? 'public_org',
    })),
  }
}

function mapNote(raw: RawNote): Note {
  return {
    id: raw.id ?? raw._id ?? raw.slug, area: raw.area, slug: raw.slug, title: raw.title, kind: raw.kind ?? 'note',
    aliases: raw.aliases ?? [], body: raw.body ?? '',
    sensitivity: raw.sensitivity, visibleTo: raw.visible_to ?? [], version: raw.version,
    outlinks: (raw.outlinks ?? []).map((outlink) => ({
      display: outlink.display,
      targetId: outlink.target_id ?? undefined,
      targetSlug: outlink.target_slug ?? undefined,
      targetTitle: outlink.target_title,
      targetArea: outlink.target_area,
      access: outlink.access ?? (outlink.target_id ? 'accessible' : 'missing'),
    })),
    unresolved: raw.unresolved ?? [],
    updatedAt: raw.updated_at ?? new Date().toISOString(), updatedBy: raw.updated_by ?? 'Usuario', versions: [],
  }
}

function mapMember(raw: RawMember): Member {
  return {
    id: raw._id, name: raw.name ?? raw.email.split('@')[0], email: raw.email,
    role: raw.role, status: raw.status,
    memberships: Object.fromEntries((raw.memberships ?? []).map((membership) => [membership.area, membership.access])),
  }
}

let cachedContext: ContextResponse | null = null

export const httpApi = {
  async login(email: string, password: string): Promise<Session> {
    await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    cachedContext = await request<ContextResponse>('/knowledge/context')
    return mapContext(cachedContext).session
  },
  async getSession(): Promise<Session> {
    cachedContext = await request<ContextResponse>('/knowledge/context')
    return mapContext(cachedContext).session
  },
  async logout(): Promise<void> { await request('/auth/logout', { method: 'POST' }); cachedContext = null },
  async getAreas(): Promise<Area[]> {
    cachedContext ??= await request<ContextResponse>('/knowledge/context')
    return mapContext(cachedContext).areas
  },
  async getNotes(): Promise<Note[]> {
    const page = await request<NotesPage>('/knowledge/notes?limit=20000')
    if (page.truncated) {
      console.warn(`[knowvault] El mapa llegó incompleto: ${page.items.length} de ${page.total} notas. Los enlaces a las notas ausentes se verán como pendientes.`)
    }
    return page.items.map(mapNote)
  },
  async getNote(ref: string): Promise<Note> {
    return mapNote(await request<RawNote>(`/knowledge/notes/${encodeURIComponent(ref)}`))
  },

  async searchNotes(query: string, area?: string): Promise<string[]> {
    const params = new URLSearchParams({ q: query, limit: '50' })
    if (area) params.set('area', area)
    const results = await request<Array<{ slug: string }>>(`/knowledge/search?${params.toString()}`)
    return results.map((result) => result.slug)
  },
  async getVersions(ref: string): Promise<NoteVersion[]> {
    const versions = await request<Array<{ version: number; title: string; body: string; edited_at?: string; edited_by?: string }>>(`/knowledge/notes/${encodeURIComponent(ref)}/versions`)
    return versions.map((version) => ({ version: version.version, title: version.title, body: version.body, editedAt: version.edited_at ?? '', editedBy: version.edited_by ?? 'Usuario' }))
  },
  async getMembers(): Promise<Member[]> { return (await request<RawMember[]>('/users')).map(mapMember) },
  async createArea(input: { key: string; name: string; description: string; defaultSensitivity: Sensitivity }): Promise<Area> {
    await request('/areas', { method: 'POST', body: JSON.stringify({ key: input.key, name: input.name, description: input.description, default_sensitivity: input.defaultSensitivity, tenant: 'current' }) })
    cachedContext = await request<ContextResponse>('/knowledge/context')
    const area = mapContext(cachedContext).areas.find((item) => item.key === input.key)
    if (!area) throw new Error('El área se creó, pero no pudo cargarse en el contexto.')
    return area
  },
  async saveArea(key: string, input: { name: string; description: string; defaultSensitivity: Sensitivity }): Promise<Area> {
    await request(`/areas/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify({ name: input.name, description: input.description, default_sensitivity: input.defaultSensitivity }) })
    cachedContext = await request<ContextResponse>('/knowledge/context')
    const area = mapContext(cachedContext).areas.find((item) => item.key === key)
    if (!area) throw new Error('El área se actualizó, pero no pudo cargarse en el contexto.')
    return area
  },
  async saveNote(id: string, patch: Partial<Note>, baseVersion: number): Promise<Note> {
    try {
      const raw = await request<RawNote>(`/knowledge/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ base_version: baseVersion, title: patch.title, body: patch.body, sensitivity: patch.sensitivity, visible_to: patch.visibleTo }) })
      return mapNote(raw)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) throw new Error('VERSION_CONFLICT')
      throw error
    }
  },
  async createNote(area: string, title: string): Promise<Note> {
    const raw = await request<RawNote>('/knowledge/notes', { method: 'POST', body: JSON.stringify({ area, title, body: `# ${title}\n\nEmpieza a escribir aquí…`, sensitivity: 'internal_area', visible_to: [area] }) })
    return mapNote(raw)
  },
  async archiveNote(id: string, baseVersion: number): Promise<DeleteNoteResult> {
    const result = await request<{ archived: true; pending_connections: number; updated_notes: number }>(
      `/knowledge/notes/${id}?base_version=${baseVersion}`,
      { method: 'DELETE' },
    )
    return {
      archived: result.archived,
      pendingConnections: result.pending_connections,
      updatedNotes: result.updated_notes,
    }
  },
  async saveMember(member: Member): Promise<Member> {
    const memberships = Object.entries(member.memberships).map(([area, access]) => ({ area, access }))
    if (member.id.includes('-')) {
      return mapMember(await request<RawMember>('/users/invite', { method: 'POST', body: JSON.stringify({ email: member.email, name: member.name, role: member.role, memberships }) }))
    }
    return mapMember(await request<RawMember>(`/users/${member.id}`, { method: 'PATCH', body: JSON.stringify({ name: member.name, role: member.role, status: member.status, memberships }) }))
  },
}
