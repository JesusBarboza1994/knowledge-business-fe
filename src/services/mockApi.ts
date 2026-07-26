import { initialAreas, initialMembers, initialNotes, mockSession } from '../data/mockData'
import type { Area, DeleteNoteResult, Member, Note, Sensitivity, Session, UploadedAsset } from '../types'
import { extractWikiLinks } from '../lib/wiki'

const STORAGE_KEY = 'knowledge-hub-mock-state-v1'

interface Database { notes: Note[]; members: Member[]; areas: Area[] }

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

function load(): Database {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return { notes: structuredClone(initialNotes), members: structuredClone(initialMembers), areas: structuredClone(initialAreas) }
  try {
    const parsed = JSON.parse(stored) as Partial<Database>
    return {
      notes: parsed.notes ?? structuredClone(initialNotes),
      members: parsed.members ?? structuredClone(initialMembers),
      areas: parsed.areas ?? structuredClone(initialAreas),
    }
  } catch {
    return { notes: structuredClone(initialNotes), members: structuredClone(initialMembers), areas: structuredClone(initialAreas) }
  }
}

function persist(db: Database) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)) }

/** 1x1 transparent PNG: mock mode has no asset storage, so nothing should hit the network. */
const PLACEHOLDER_ASSET =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export const mockApi = {
  assetUrl(id: string): string { void id; return PLACEHOLDER_ASSET },
  async uploadAsset(file: File, area: string): Promise<UploadedAsset> {
    void area
    await delay(400)
    const id = Math.random().toString(16).slice(2).padEnd(24, '0').slice(0, 24)
    return {
      id, filename: file.name, mime: file.type, size: file.size,
      ref: `kb:asset/${id}`, markdown: `![${file.name}](kb:asset/${id})`,
    }
  },
  async login(email: string, password: string): Promise<Session> {
    await delay(420)
    if (!email.includes('@') || password.length < 4) throw new Error('El correo o la contraseña no son válidos.')
    return { ...mockSession, email }
  },
  async getSession(): Promise<Session> { await delay(80); return structuredClone(mockSession) },
  async logout(): Promise<void> { await delay(80) },
  async getAreas(): Promise<Area[]> { await delay(); return structuredClone(load().areas) },
  async getNotes(): Promise<Note[]> { await delay(); return load().notes.map((note) => ({ ...note, body: '' })) },
  async getNote(ref: string): Promise<Note> {
    await delay(90)
    const note = load().notes.find((item) => item.slug === ref || item.id === ref)
    if (!note) throw new Error('La nota ya no existe.')
    return note
  },
  async searchNotes(query: string, area?: string): Promise<string[]> {
    await delay(90)
    const term = query.toLowerCase()
    return load().notes
      .filter((note) => !note.archived && (!area || note.area === area))
      .filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(term))
      .map((note) => note.slug)
  },
  async getMembers(): Promise<Member[]> { await delay(); return load().members },
  async createArea(input: { key: string; name: string; description: string; defaultSensitivity: Sensitivity }): Promise<Area> {
    await delay()
    const db = load()
    if (db.areas.some((area) => area.key === input.key)) throw new Error('Ya existe un área con esa clave.')
    const palette = ['#b7e66b', '#76b7ff', '#e9a86f', '#c49af1', '#6dd6c8', '#ef8da1']
    const area: Area = { ...input, color: palette[db.areas.length % palette.length], access: 'manage', noteCount: 0 }
    db.areas.push(area)
    persist(db)
    return area
  },
  async saveArea(key: string, input: { name: string; description: string; defaultSensitivity: Sensitivity }): Promise<Area> {
    await delay()
    const db = load()
    const index = db.areas.findIndex((area) => area.key === key)
    if (index < 0) throw new Error('El área ya no existe.')
    db.areas[index] = { ...db.areas[index], ...input }
    persist(db)
    return db.areas[index]
  },
  async getVersions(ref: string) { await delay(); return load().notes.find((note) => note.slug === ref || note.id === ref)?.versions ?? [] },
  async saveNote(id: string, patch: Partial<Note>, baseVersion: number): Promise<Note> {
    await delay(260)
    const db = load(); const index = db.notes.findIndex((note) => note.id === id)
    if (index < 0) throw new Error('La nota ya no existe.')
    const current = db.notes[index]
    if (current.version !== baseVersion) throw new Error('VERSION_CONFLICT')
    const next: Note = {
      ...current,
      ...patch,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: mockSession.name,
      versions: [{ version: current.version, title: current.title, body: current.body, editedAt: current.updatedAt, editedBy: current.updatedBy }, ...current.versions],
    }
    db.notes[index] = next; persist(db); return next
  },
  async createNote(area: string, title: string): Promise<Note> {
    await delay(220); const db = load()
    const note: Note = {
      id: crypto.randomUUID(), area, slug: title.toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/g, '-').replace(/^-|-$/g, ''), title,
      kind: 'note', body: `# ${title}\n\nEmpieza a escribir aquí…`, sensitivity: 'internal_area', visibleTo: [area], version: 1,
      updatedAt: new Date().toISOString(), updatedBy: mockSession.name, versions: [],
    }
    db.notes.unshift(note); persist(db); return note
  },
  async archiveNote(id: string, baseVersion?: number): Promise<DeleteNoteResult> {
    void baseVersion
    await delay()
    const db = load()
    const note = db.notes.find((item) => item.id === id)
    if (!note) throw new Error('La nota ya no existe.')
    const sources = db.notes.filter(
      (source) => source.id !== id && !source.archived && extractWikiLinks(source.body, db.notes).some((link) => link.target?.id === id),
    )
    const pending = sources.reduce(
      (total, source) => total + extractWikiLinks(source.body, db.notes).filter((link) => link.target?.id === id).length,
      0,
    )
    const target = db.notes.find((item) => item.id === id)
    if (target) target.archived = true
    persist(db)
    return { archived: true, pendingConnections: pending, updatedNotes: sources.length }
  },
  async saveMember(member: Member): Promise<Member> { await delay(); const db = load(); const index = db.members.findIndex((item) => item.id === member.id); if (index >= 0) db.members[index] = member; else db.members.push(member); persist(db); return member },
  reset() { localStorage.removeItem(STORAGE_KEY) },
}
