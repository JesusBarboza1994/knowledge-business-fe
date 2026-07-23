import { initialAreas, initialMembers, initialNotes, mockSession } from '../data/mockData'
import type { Area, DeleteNoteResult, Member, Note, Session } from '../types'
import { extractWikiLinks, unlinkNoteReferences } from '../lib/wiki'

const STORAGE_KEY = 'knowledge-hub-mock-state-v1'

interface Database { notes: Note[]; members: Member[] }

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

function load(): Database {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return { notes: structuredClone(initialNotes), members: structuredClone(initialMembers) }
  try { return JSON.parse(stored) as Database } catch { return { notes: structuredClone(initialNotes), members: structuredClone(initialMembers) } }
}

function persist(db: Database) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)) }

export const mockApi = {
  async login(email: string, password: string): Promise<Session> {
    await delay(420)
    if (!email.includes('@') || password.length < 4) throw new Error('El correo o la contraseña no son válidos.')
    return { ...mockSession, email }
  },
  async getSession(): Promise<Session> { await delay(80); return structuredClone(mockSession) },
  async logout(): Promise<void> { await delay(80) },
  async getAreas(): Promise<Area[]> { await delay(); return structuredClone(initialAreas) },
  async getNotes(): Promise<Note[]> { await delay(); return load().notes },
  async getMembers(): Promise<Member[]> { await delay(); return load().members },
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
    const outgoing = extractWikiLinks(note.body, db.notes).length
    let inbound = 0
    let updatedNotes = 0
    db.notes = db.notes.map((source) => {
      if (source.id === id || source.archived) return source
      const unlinked = unlinkNoteReferences(source.body, note)
      if (!unlinked.removedLinks) return source
      inbound += unlinked.removedLinks
      updatedNotes += 1
      return {
        ...source,
        body: unlinked.body,
        version: source.version + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: mockSession.name,
        versions: [{
          version: source.version,
          title: source.title,
          body: source.body,
          editedAt: source.updatedAt,
          editedBy: source.updatedBy,
        }, ...source.versions],
      }
    })
    const target = db.notes.find((item) => item.id === id)
    if (target) target.archived = true
    persist(db)
    return { archived: true, brokenConnections: inbound + outgoing, updatedNotes }
  },
  async saveMember(member: Member): Promise<Member> { await delay(); const db = load(); const index = db.members.findIndex((item) => item.id === member.id); if (index >= 0) db.members[index] = member; else db.members.push(member); persist(db); return member },
  reset() { localStorage.removeItem(STORAGE_KEY) },
}
