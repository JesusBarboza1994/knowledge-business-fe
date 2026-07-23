export type AccessLevel = 'read' | 'write' | 'manage'
export type NoteKind = 'note' | 'index' | 'log'
export type Sensitivity = 'public_org' | 'internal_area' | 'confidential'

export interface Area {
  key: string
  name: string
  description: string
  color: string
  access: AccessLevel
  noteCount: number
}

export interface NoteVersion {
  version: number
  body: string
  title: string
  editedAt: string
  editedBy: string
}

export interface Note {
  id: string
  area: string
  slug: string
  title: string
  kind: NoteKind
  body: string
  sensitivity: Sensitivity
  visibleTo: string[]
  version: number
  updatedAt: string
  updatedBy: string
  archived?: boolean
  versions: NoteVersion[]
}

export interface Member {
  id: string
  name: string
  email: string
  role: 'member' | 'admin'
  status: 'active' | 'invited'
  memberships: Record<string, AccessLevel>
}

export interface Session {
  userId: string
  email: string
  name: string
  tenant: string
  organizationName: string
  role: 'member' | 'admin'
}

export interface WikiLink {
  raw: string
  title: string
  anchor?: string
  target?: Note
}

export interface DeleteNoteResult {
  archived: true
  brokenConnections: number
  updatedNotes: number
}
