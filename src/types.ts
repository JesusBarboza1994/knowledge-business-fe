export type AccessLevel = 'read' | 'write' | 'manage'
/** Vista principal del workspace. Aquí, y no en Workspace, para que los paneles la usen sin ciclo de imports. */
export type MainView = 'note' | 'graph' | 'admin'
export type NoteKind = 'note' | 'index' | 'log'
export type Sensitivity = 'public_org' | 'internal_area' | 'confidential'
export type UserRole = 'member' | 'admin' | 'superadmin'
export type UserStatus = 'active' | 'invited' | 'inactive'

export interface Area {
  key: string
  name: string
  description: string
  color: string
  access: AccessLevel
  noteCount: number
  defaultSensitivity: Sensitivity
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
  aliases?: string[]
  body: string
  sensitivity: Sensitivity
  visibleTo: string[]
  outlinks?: NoteOutlink[]
  unresolved?: Array<{ name: string }>
  version: number
  updatedAt: string
  updatedBy: string
  archived?: boolean
  versions: NoteVersion[]
}

export interface NoteOutlink {
  display: string
  targetId?: string
  targetSlug?: string
  targetTitle?: string
  targetArea?: string
  access: 'accessible' | 'restricted' | 'missing'
}

export interface Member {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  memberships: Record<string, AccessLevel>
}

export interface Session {
  userId: string
  email: string
  name: string
  tenant: string
  organizationName: string
  role: UserRole
}

export interface WikiLink {
  raw: string
  title: string
  anchor?: string
  target?: Note
  targetRef?: string
  restricted?: boolean
}

export interface DeleteNoteResult {
  archived: true
  pendingConnections: number
  updatedNotes: number
}

export interface UploadedAsset {
  id: string
  filename: string
  mime: string
  size: number
  width?: number
  height?: number
  /** Body reference, `kb:asset/<id>`. Resolved to a real URL only at render time. */
  ref: string
  /** Ready to paste into a note body. */
  markdown: string
}
