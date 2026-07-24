import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronDown, CirclePlus, FolderKanban, MailPlus, MoreHorizontal, Shield, Users } from 'lucide-react'
import { api } from '../services/api'
import type { AccessLevel, Area, Member, Sensitivity, UserRole, UserStatus } from '../types'

type AdminSection = 'people' | 'areas'

interface Props {
  currentUserId: string
  members: Member[]
  areas: Area[]
  onMemberSaved: (member: Member) => void
  onAreaSaved: (area: Area, created: boolean) => void
}

const sensitivityLabels: Record<Sensitivity, string> = {
  public_org: 'Público en la organización',
  internal_area: 'Interno del área',
  confidential: 'Confidencial',
}

const roleLabels: Record<UserRole, string> = {
  member: 'Miembro',
  admin: 'Administrador',
  superadmin: 'Superadministrador',
}

const statusLabels: Record<UserStatus, string> = {
  active: 'Activo',
  invited: 'Invitado',
  inactive: 'Inactivo',
}

export function AdminPanel({ currentUserId, members, areas, onMemberSaved, onAreaSaved }: Props) {
  const [section, setSection] = useState<AdminSection>('people')
  const [selectedId, setSelectedId] = useState(members[0]?.id)
  const [selectedAreaKey, setSelectedAreaKey] = useState(areas[0]?.key)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createAreaOpen, setCreateAreaOpen] = useState(false)
  const selected = members.find((member) => member.id === selectedId)
  const selectedArea = areas.find((area) => area.key === selectedAreaKey)

  useEffect(() => {
    if (!areas.some((area) => area.key === selectedAreaKey)) setSelectedAreaKey(areas[0]?.key)
  }, [areas, selectedAreaKey])

  return (
    <div className="admin-panel flex min-h-0 flex-1 flex-col overflow-auto bg-[#141611]">
      <header className="admin-header flex min-h-[62px] items-center gap-3 border-b border-line px-6">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${section === 'people' ? 'bg-sky-400/10 text-sky-300' : 'bg-moss/10 text-moss'}`}>
          {section === 'people' ? <Users size={18} /> : <FolderKanban size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[.15em] text-muted">Administración</p>
          <h2 className="truncate font-medium">{section === 'people' ? 'Personas y accesos' : 'Áreas de conocimiento'}</h2>
        </div>
        <button
          className="primary-button"
          aria-label={section === 'people' ? 'Invitar persona' : 'Crear área'}
          onClick={() => section === 'people' ? setInviteOpen(true) : setCreateAreaOpen(true)}
        >
          {section === 'people' ? <MailPlus size={15} /> : <CirclePlus size={15} />}
          <span>{section === 'people' ? 'Invitar persona' : 'Crear área'}</span>
        </button>
      </header>

      <div className="border-b border-line px-4 py-2 sm:px-6">
        <div className="admin-section-tabs">
          <button className={section === 'people' ? 'active' : ''} onClick={() => setSection('people')}><Users size={15} /> Personas</button>
          <button className={section === 'areas' ? 'active' : ''} onClick={() => setSection('areas')}><FolderKanban size={15} /> Áreas</button>
        </div>
      </div>

      {section === 'people' ? (
        <PeopleSection
          currentUserId={currentUserId}
          members={members}
          areas={areas}
          selected={selected}
          onSelect={setSelectedId}
          onSaved={onMemberSaved}
        />
      ) : (
        <AreasSection
          areas={areas}
          selected={selectedArea}
          onSelect={setSelectedAreaKey}
          onSaved={(area) => onAreaSaved(area, false)}
        />
      )}

      {inviteOpen && (
        <InviteDialog
          areas={areas}
          onClose={() => setInviteOpen(false)}
          onInvite={async (member) => {
            const saved = await api.saveMember(member)
            onMemberSaved(saved)
            setSelectedId(saved.id)
            setInviteOpen(false)
          }}
        />
      )}
      {createAreaOpen && (
        <CreateAreaDialog
          onClose={() => setCreateAreaOpen(false)}
          onCreate={async (input) => {
            const saved = await api.createArea(input)
            onAreaSaved(saved, true)
            setSelectedAreaKey(saved.key)
            setCreateAreaOpen(false)
          }}
        />
      )}
    </div>
  )
}

function PeopleSection({ currentUserId, members, areas, selected, onSelect, onSaved }: {
  currentUserId: string
  members: Member[]
  areas: Area[]
  selected?: Member
  onSelect: (id: string) => void
  onSaved: (member: Member) => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function updateMember(patch: Partial<Member>) {
    if (!selected || selected.role === 'superadmin') return
    setSaving(true); setSaved(false); setError('')
    try {
      const updated = await api.saveMember({ ...selected, ...patch })
      onSaved(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la persona.')
    } finally {
      setSaving(false)
    }
  }

  function updateMembership(area: string, access: AccessLevel | 'none') {
    if (!selected) return
    const memberships = { ...selected.memberships }
    if (access === 'none') delete memberships[area]
    else memberships[area] = access
    void updateMember({ memberships })
  }

  const protectsIdentity = selected?.id === currentUserId || selected?.role === 'superadmin'

  return (
    <div className="admin-grid mx-auto grid w-full max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_1.15fr]">
      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div><h3 className="text-sm font-medium">Miembros</h3><p className="mt-1 text-xs text-muted">{members.length} personas en la organización</p></div>
          <button className="icon-button" aria-label="Opciones de miembros"><MoreHorizontal size={16} /></button>
        </div>
        <div className="divide-y divide-line">
          {members.map((member) => (
            <button key={member.id} onClick={() => onSelect(member.id)} className={`member-row ${selected?.id === member.id ? 'active' : ''}`}>
              <span className="avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <span className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm font-medium">{member.name}</strong><span className="block truncate text-xs text-muted">{member.email}</span></span>
              <span className={`status-dot ${member.status}`} title={statusLabels[member.status]} />
              {member.role !== 'member' && <Shield size={14} className={member.role === 'superadmin' ? 'text-amber-300' : 'text-moss'} />}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        {selected ? (
          <>
            <div className="border-b border-line p-5">
              <div className="member-detail-head flex items-start gap-4">
                <span className="avatar large">{selected.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <div className="min-w-0 flex-1"><h3 className="font-medium">{selected.name}</h3><p className="mt-1 truncate text-xs text-muted">{selected.email}</p></div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">{roleLabels[selected.role]}</span>
              </div>
            </div>

            <div className="border-b border-line p-5">
              <div className="mb-4 flex items-center justify-between">
                <div><h4 className="text-sm font-medium">Cuenta</h4><p className="mt-1 text-xs text-muted">Rol administrativo y estado de acceso.</p></div>
                {saving && <span className="flex items-center gap-2 text-xs text-muted"><span className="loader small" /> Guardando</span>}
                {saved && <span className="flex items-center gap-1 text-xs text-moss"><Check size={13} /> Guardado</span>}
              </div>
              {error && <p className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}
              {protectsIdentity && <p className="mb-4 rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-2 text-xs leading-5 text-amber-100/75">{selected.role === 'superadmin' ? 'El rol y estado de un superadministrador no se modifican desde esta consola.' : 'Para evitar perder acceso, no puedes cambiar tu propio rol ni desactivar tu cuenta.'}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="field-label">Rol</span><select className="field" value={selected.role} disabled={protectsIdentity || saving} onChange={(event) => void updateMember({ role: event.target.value as UserRole })}><option value="member">Miembro</option><option value="admin">Administrador</option>{selected.role === 'superadmin' && <option value="superadmin">Superadministrador</option>}</select></label>
                <label><span className="field-label">Estado</span><select className="field" value={selected.status} disabled={protectsIdentity || saving} onChange={(event) => void updateMember({ status: event.target.value as UserStatus })}><option value="active">Activo</option><option value="invited">Invitado</option><option value="inactive">Inactivo</option></select></label>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4"><h4 className="text-sm font-medium">Acceso por área</h4><p className="mt-1 text-xs text-muted">Define qué puede leer, editar o administrar.</p></div>
              <div className="space-y-2">
                {areas.map((area) => (
                  <div key={area.key} className="admin-area-row flex items-center gap-3 rounded-lg border border-line bg-ink/40 p-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                    <div className="min-w-0 flex-1"><strong className="block text-sm font-medium">{area.name}</strong><span className="text-xs text-muted">{area.description}</span></div>
                    <span className="relative">
                      <select value={selected.memberships[area.key] ?? 'none'} disabled={selected.role === 'superadmin' || saving} onChange={(event) => updateMembership(area.key, event.target.value as AccessLevel | 'none')} className="admin-access-select appearance-none rounded-md border-line bg-panel py-1.5 pl-3 pr-8 text-xs text-stone-200 focus:border-moss/40 focus:ring-moss/20 disabled:opacity-50"><option value="none">Sin acceso</option><option value="read">Lectura</option><option value="write">Escritura</option><option value="manage">Administración</option></select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : <div className="p-8 text-center text-sm text-muted">No hay personas para administrar.</div>}
      </section>
    </div>
  )
}

function AreasSection({ areas, selected, onSelect, onSaved }: { areas: Area[]; selected?: Area; onSelect: (key: string) => void; onSaved: (area: Area) => void }) {
  return (
    <div className="admin-grid mx-auto grid w-full max-w-6xl gap-6 p-6 lg:grid-cols-[.85fr_1.15fr]">
      <section className="surface-card overflow-hidden">
        <div className="border-b border-line p-4"><h3 className="text-sm font-medium">Áreas</h3><p className="mt-1 text-xs text-muted">{areas.length} espacios de conocimiento</p></div>
        <div className="divide-y divide-line">
          {areas.map((area) => (
            <button key={area.key} onClick={() => onSelect(area.key)} className={`member-row ${selected?.key === area.key ? 'active' : ''}`}>
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line bg-ink/50"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color }} /></span>
              <span className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm font-medium">{area.name}</strong><span className="block truncate text-xs text-muted">{area.key} · {area.noteCount} notas</span></span>
            </button>
          ))}
        </div>
      </section>
      <section className="surface-card overflow-hidden">
        {selected ? <AreaEditor key={selected.key} area={selected} onSaved={onSaved} /> : <div className="p-8 text-center text-sm text-muted">Crea tu primera área de conocimiento.</div>}
      </section>
    </div>
  )
}

function AreaEditor({ area, onSaved }: { area: Area; onSaved: (area: Area) => void }) {
  const [name, setName] = useState(area.name)
  const [description, setDescription] = useState(area.description)
  const [defaultSensitivity, setDefaultSensitivity] = useState(area.defaultSensitivity)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const dirty = name !== area.name || description !== area.description || defaultSensitivity !== area.defaultSensitivity

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !dirty) return
    setSaving(true); setSaved(false); setError('')
    try {
      const updated = await api.saveArea(area.key, { name: name.trim(), description: description.trim(), defaultSensitivity })
      onSaved(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el área.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="flex items-start gap-4 border-b border-line p-5">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-line bg-ink/50"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: area.color }} /></span>
        <div className="min-w-0 flex-1"><p className="eyebrow">Área</p><h3 className="mt-1 font-medium">{area.name}</h3><p className="mt-1 text-xs text-muted">{area.key} · {area.noteCount} notas</p></div>
        {saved && <span className="flex items-center gap-1 text-xs text-moss"><Check size={13} /> Guardado</span>}
      </div>
      <div className="space-y-4 p-5">
        {error && <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}
        <label className="block"><span className="field-label">Nombre</span><input className="field" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="block"><span className="field-label">Descripción</span><textarea className="field min-h-24 resize-y py-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Qué conocimiento pertenece a esta área" /></label>
        <label className="block"><span className="field-label">Sensibilidad predeterminada</span><select className="field" value={defaultSensitivity} onChange={(event) => setDefaultSensitivity(event.target.value as Sensitivity)}>{Object.entries(sensitivityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="mt-2 text-xs leading-5 text-muted">Se aplicará inicialmente a las notas nuevas del área.</p></label>
      </div>
      <div className="flex justify-end border-t border-line p-4"><button className="primary-button" disabled={!dirty || !name.trim() || saving}>{saving ? <span className="loader dark small" /> : 'Guardar cambios'}</button></div>
    </form>
  )
}

function InviteDialog({ areas, onClose, onInvite }: { areas: Area[]; onClose: () => void; onInvite: (member: Member) => Promise<void> }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState(areas[0]?.key ?? '')
  const [access, setAccess] = useState<AccessLevel>('read')
  const [role, setRole] = useState<Extract<UserRole, 'member' | 'admin'>>('member')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.includes('@')) return
    setSaving(true); setError('')
    try {
      await onInvite({ id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), role, status: 'invited', memberships: area ? { [area]: access } : {} })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la invitación.')
      setSaving(false)
    }
  }

  return <div className="modal-backdrop"><form className="modal-card invite-modal max-w-md p-6" onSubmit={submit}><p className="eyebrow">Nueva invitación</p><h2 className="mt-1 text-xl font-medium">Invitar a la organización</h2><div className="mt-6 space-y-4">{error && <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}<label className="block"><span className="field-label">Nombre</span><input className="field" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre de la persona" /></label><label className="block"><span className="field-label">Correo</span><input className="field" type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="persona@empresa.com" /></label><label className="block"><span className="field-label">Rol</span><select className="field" value={role} onChange={(event) => setRole(event.target.value as 'member' | 'admin')}><option value="member">Miembro</option><option value="admin">Administrador</option></select></label><div className="invite-fields grid grid-cols-2 gap-3"><label><span className="field-label">Área inicial</span><select className="field" value={area} onChange={(event) => setArea(event.target.value)}>{areas.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label><label><span className="field-label">Acceso</span><select className="field" value={access} onChange={(event) => setAccess(event.target.value as AccessLevel)}><option value="read">Lectura</option><option value="write">Escritura</option><option value="manage">Administración</option></select></label></div></div><div className="modal-actions mt-6 flex justify-end gap-3"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" disabled={!name.trim() || !email.includes('@') || saving}>{saving ? <span className="loader dark small" /> : 'Crear invitación'}</button></div></form></div>
}

function CreateAreaDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { key: string; name: string; description: string; defaultSensitivity: Sensitivity }) => Promise<void> }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [keyEdited, setKeyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [defaultSensitivity, setDefaultSensitivity] = useState<Sensitivity>('internal_area')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const validKey = /^[a-z0-9-]{2,40}$/.test(key)

  function slugify(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !validKey) return
    setSaving(true); setError('')
    try {
      await onCreate({ key, name: name.trim(), description: description.trim(), defaultSensitivity })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el área.')
      setSaving(false)
    }
  }

  return <div className="modal-backdrop"><form className="modal-card invite-modal max-w-lg p-6" onSubmit={submit}><p className="eyebrow">Nueva área</p><h2 className="mt-1 text-xl font-medium">Crear espacio de conocimiento</h2><p className="mt-2 text-sm leading-6 text-muted">El índice y el registro del área se prepararán automáticamente.</p><div className="mt-6 space-y-4">{error && <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}<label className="block"><span className="field-label">Nombre</span><input className="field" autoFocus value={name} onChange={(event) => { const next = event.target.value; setName(next); if (!keyEdited) setKey(slugify(next)) }} placeholder="Ej. Marketing" /></label><label className="block"><span className="field-label">Clave del área</span><input className="field font-mono" value={key} onChange={(event) => { setKeyEdited(true); setKey(slugify(event.target.value)) }} placeholder="marketing" /><p className={`mt-2 text-xs ${key && !validKey ? 'text-red-300' : 'text-muted'}`}>Entre 2 y 40 caracteres: minúsculas, números y guiones. No podrá cambiarse después.</p></label><label className="block"><span className="field-label">Descripción</span><textarea className="field min-h-24 resize-y py-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Qué conocimiento pertenece a esta área" /></label><label className="block"><span className="field-label">Sensibilidad predeterminada</span><select className="field" value={defaultSensitivity} onChange={(event) => setDefaultSensitivity(event.target.value as Sensitivity)}>{Object.entries(sensitivityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="modal-actions mt-6 flex justify-end gap-3"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-button" disabled={!name.trim() || !validKey || saving}>{saving ? <span className="loader dark small" /> : 'Crear área'}</button></div></form></div>
}
