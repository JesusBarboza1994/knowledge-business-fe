import { useCallback, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, CirclePlus, File, FileClock, FileText, FolderKanban, GitGraph, Info, LayoutPanelLeft, LogOut, Menu, MoreHorizontal, Network, PanelRightClose, PanelRightOpen, Search, Settings2, Shield, Trash2, TriangleAlert, X } from 'lucide-react'
import { AdminPanel } from './AdminPanel'
import { KnowledgeGraph } from './KnowledgeGraph'
import { MarkdownEditor } from './MarkdownEditor'
import { extractNoteLinks, uniqueLinks } from '../lib/wiki'
import { api } from '../services/api'
import type { Area, Member, Note, Session } from '../types'

type MainView = 'note' | 'graph' | 'admin'

interface Props { session: Session; initialAreas: Area[]; initialNotes: Note[]; initialMembers: Member[]; onLogout: () => void }

export function Workspace({ session, initialAreas, initialNotes, initialMembers, onLogout }: Props) {
  const [areas] = useState(initialAreas)
  const [notes, setNotes] = useState(initialNotes)
  const [members, setMembers] = useState(initialMembers)
  const [activeArea, setActiveArea] = useState(initialAreas[0]?.key ?? '')
  const firstNote = initialNotes.find((note) => note.area === activeArea && note.kind === 'index') ?? initialNotes[0]
  const [tabs, setTabs] = useState<string[]>(firstNote ? [firstNote.id] : [])
  const [selectedId, setSelectedId] = useState(firstNote?.id)
  const [view, setView] = useState<MainView>('note')
  const [query, setQuery] = useState('')
  const [rightOpen, setRightOpen] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [mobileMore, setMobileMore] = useState(false)
  const [mobileInspector, setMobileInspector] = useState(false)
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false)
  const [hoveredNoteSlug, setHoveredNoteSlug] = useState<string>()

  const selectedNote = notes.find((note) => note.id === selectedId)
  const area = areas.find((item) => item.key === activeArea)
  const areaNotes = notes.filter((note) => note.area === activeArea && !note.archived)
  const filteredNotes = areaNotes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()))
  const canEdit = area?.access === 'write' || area?.access === 'manage'
  const selectedArea = areas.find((item) => item.key === selectedNote?.area)

  const openNote = useCallback((ref: string) => {
    const note = notes.find((item) => item.slug === ref || item.id === ref)
    if (!note || note.archived) return
    setSelectedId(note.id); setActiveArea(note.area); setTabs((current) => current.includes(note.id) ? current : [...current, note.id]); setView('note'); setMobileNav(false); setHoveredNoteSlug(undefined)
  }, [notes])

  function closeTab(id: string) {
    setTabs((current) => {
      const index = current.indexOf(id); const next = current.filter((item) => item !== id)
      if (selectedId === id) setSelectedId(next[Math.min(index, next.length - 1)])
      return next
    })
  }

  function switchArea(key: string) {
    setActiveArea(key); const index = notes.find((note) => note.area === key && note.kind === 'index' && !note.archived) ?? notes.find((note) => note.area === key && !note.archived)
    if (index) openNote(index.id)
  }

  async function createNote(title: string) {
    const note = await api.createNote(activeArea, title); setNotes((current) => [note, ...current]); setNewNoteOpen(false)
    setTabs((current) => [...current, note.id]); setSelectedId(note.id); setView('note')
  }

  async function deleteSelected() {
    if (!selectedNote) return
    await api.archiveNote(selectedNote.id, selectedNote.version)
    setNotes(await api.getNotes())
    setDeleteNoteOpen(false)
    closeTab(selectedNote.id)
  }

  return <div className="workspace-root flex h-screen overflow-hidden bg-ink text-stone-200">
    {mobileNav && <button className="mobile-drawer-backdrop" aria-label="Cerrar explorador" onClick={() => setMobileNav(false)} />}
    <aside className={`workspace-sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="flex min-h-[62px] items-center gap-3 border-b border-line px-4"><div className="grid h-8 w-8 place-items-center rounded-lg bg-moss/10 text-moss"><Network size={17} /></div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{session.organizationName}</strong><span className="block truncate text-[11px] text-muted">{session.tenant}.knowledge</span></div><button className="icon-button lg:hidden" aria-label="Cerrar explorador" onClick={() => setMobileNav(false)}><X size={16} /></button></div>
      <div className="border-b border-line p-3"><label className="sidebar-search"><Search size={14} /><input placeholder="Buscar notas…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘K</kbd></label></div>
      <div className="border-b border-line p-3"><p className="sidebar-label">Área actual</p><div className="relative"><select className="area-select" value={activeArea} onChange={(event) => switchArea(event.target.value)}>{areas.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select><span className="area-color" style={{ backgroundColor: area?.color }} /><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></div><div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted"><span>{area?.noteCount} notas</span><span className="uppercase tracking-wider">Acceso: {area?.access}</span></div></div>
      <nav className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2"><button className={`nav-mode ${view === 'note' ? 'active' : ''}`} onClick={() => setView('note')}><LayoutPanelLeft size={14} /> Notas</button><button className={`nav-mode ${view === 'graph' ? 'active' : ''}`} onClick={() => setView('graph')}><GitGraph size={14} /> Grafo</button></div>
        <div className="min-h-0 flex-1 overflow-auto px-2 py-3"><div className="mb-2 flex items-center justify-between px-2"><p className="sidebar-label !mb-0">{query ? 'Resultados' : 'Documentos'}</p>{canEdit && <button className="text-muted hover:text-moss" title="Nueva nota" onClick={() => setNewNoteOpen(true)}><CirclePlus size={15} /></button>}</div>{filteredNotes.length ? filteredNotes.map((note) => <button key={note.id} className={`note-row ${selectedId === note.id && view === 'note' ? 'active' : ''}`} onMouseEnter={() => setHoveredNoteSlug(note.slug)} onMouseLeave={() => setHoveredNoteSlug(undefined)} onFocus={() => setHoveredNoteSlug(note.slug)} onBlur={() => setHoveredNoteSlug(undefined)} onClick={() => openNote(note.id)}>{note.kind === 'index' ? <BookOpen size={14} /> : note.kind === 'log' ? <FileClock size={14} /> : <File size={14} />}<span className="truncate">{note.title}</span>{note.sensitivity === 'confidential' && <Shield size={11} className="ml-auto" />}</button>) : <div className="px-3 py-8 text-center text-xs text-muted">No encontramos notas.</div>}</div>
        <div className="border-t border-line p-2">{session.role === 'admin' && <button className={`bottom-nav ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}><Settings2 size={15} /> Administrar organización</button>}<button className="bottom-nav" onClick={onLogout}><LogOut size={15} /> Cerrar sesión</button></div>
      </nav>
    </aside>

    <main className="flex min-w-0 flex-1 flex-col">
      <div className="workspace-tabs flex min-h-10 items-center border-b border-line bg-[#11130f]">
        <button className="mx-2 grid h-10 w-8 place-items-center text-muted lg:hidden" aria-label="Abrir explorador" onClick={() => setMobileNav(true)}><Menu size={18} /></button>
        <div className="mobile-current-note min-w-0 flex-1 px-1">
          <span className="block truncate text-xs font-medium text-stone-200">{view === 'graph' ? 'Mapa de conocimiento' : view === 'admin' ? 'Administración' : selectedNote?.title ?? 'Notas'}</span>
          <span className="block truncate text-[9px] uppercase tracking-wider text-muted">{view === 'note' ? selectedArea?.name : session.organizationName}</span>
        </div>
        <div className="flex min-w-0 flex-1 self-stretch overflow-x-auto">{tabs.map((id) => { const note = notes.find((item) => item.id === id); if (!note) return null; return <button key={id} className={`tab ${selectedId === id && view === 'note' ? 'active' : ''}`} onClick={() => { setSelectedId(id); setActiveArea(note.area); setView('note') }}><FileText size={12} /><span className="max-w-36 truncate">{note.title}</span><span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); closeTab(id) }} className="tab-close"><X size={11} /></span></button>})}</div>
        <button className="icon-button mx-2 hidden lg:grid" onClick={() => setRightOpen((value) => !value)} title="Alternar panel de contexto">{rightOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}</button>
      </div>

      <div className="flex min-h-0 flex-1">
        {view === 'admin' ? <AdminPanel members={members} areas={areas} onMemberSaved={(member) => setMembers((current) => current.some((item) => item.id === member.id) ? current.map((item) => item.id === member.id ? member : item) : [...current, member])} />
          : view === 'graph' ? <KnowledgeGraph notes={notes} areas={areas} selectedNote={selectedNote} hoveredNoteSlug={hoveredNoteSlug} onOpenNote={openNote} />
            : selectedNote ? <MarkdownEditor note={selectedNote} notes={notes} areas={areas} canEdit={canEdit} onSaved={(saved) => setNotes((current) => current.map((note) => note.id === saved.id ? saved : note))} onOpenNote={openNote} />
              : <EmptyState onCreate={() => setNewNoteOpen(true)} canEdit={Boolean(canEdit)} />}
        {rightOpen && view !== 'admin' && <Inspector note={selectedNote} notes={notes} areas={areas} onOpenNote={openNote} onGraph={() => setView('graph')} onDelete={() => setDeleteNoteOpen(true)} canDelete={selectedArea?.access === 'manage'} />}
      </div>
    </main>
    <nav className="mobile-bottom-nav" aria-label="Navegación principal">
      <button className={view === 'note' ? 'active' : ''} onClick={() => { setView('note'); setMobileNav(true); setMobileMore(false) }}><LayoutPanelLeft size={19} /><span>Notas</span></button>
      <button className={view === 'graph' ? 'active' : ''} onClick={() => { setView('graph'); setMobileNav(false); setMobileMore(false) }}><GitGraph size={19} /><span>Grafo</span></button>
      <button className={mobileMore ? 'active' : ''} onClick={() => setMobileMore(true)}><MoreHorizontal size={20} /><span>Más</span></button>
    </nav>
    {mobileMore && <div className="mobile-sheet-backdrop" onClick={() => setMobileMore(false)}>
      <section className="mobile-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-head"><div><p className="eyebrow">Opciones</p><h2>Más acciones</h2></div><button className="icon-button" aria-label="Cerrar opciones" onClick={() => setMobileMore(false)}><X size={18} /></button></div>
        {view !== 'admin' && <button className="mobile-sheet-action" onClick={() => { setMobileMore(false); setMobileInspector(true) }}><Info size={18} /><span><strong>Contexto de la nota</strong><small>Propiedades, enlaces y backlinks</small></span></button>}
        {session.role === 'admin' && <button className="mobile-sheet-action" onClick={() => { setView('admin'); setMobileMore(false) }}><Settings2 size={18} /><span><strong>Administrar organización</strong><small>Personas y permisos por área</small></span></button>}
        <button className="mobile-sheet-action danger" onClick={onLogout}><LogOut size={18} /><span><strong>Cerrar sesión</strong><small>Salir de Knowledge Hub</small></span></button>
      </section>
    </div>}
    {mobileInspector && <div className="mobile-sheet-backdrop" onClick={() => setMobileInspector(false)}>
      <section className="mobile-sheet mobile-inspector-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mobile-sheet-handle" />
        <div className="mobile-sheet-head"><div><p className="eyebrow">Nota seleccionada</p><h2 className="truncate">{selectedNote?.title ?? 'Contexto'}</h2></div><button className="icon-button" aria-label="Cerrar contexto" onClick={() => setMobileInspector(false)}><X size={18} /></button></div>
        <Inspector mobile note={selectedNote} notes={notes} areas={areas} onOpenNote={(slug) => { setMobileInspector(false); openNote(slug) }} onGraph={() => { setMobileInspector(false); setView('graph') }} onDelete={() => { setMobileInspector(false); setDeleteNoteOpen(true) }} canDelete={selectedArea?.access === 'manage'} />
      </section>
    </div>}
    {newNoteOpen && <NewNoteDialog onClose={() => setNewNoteOpen(false)} onCreate={createNote} areaName={area?.name ?? ''} />}
    {deleteNoteOpen && selectedNote && <DeleteNoteDialog note={selectedNote} notes={notes} onClose={() => setDeleteNoteOpen(false)} onConfirm={deleteSelected} />}
  </div>
}

function Inspector({ note, notes, areas, onOpenNote, onGraph, onDelete, canDelete, mobile = false }: { note?: Note; notes: Note[]; areas: Area[]; onOpenNote: (slug: string) => void; onGraph: () => void; onDelete: () => void; canDelete: boolean; mobile?: boolean }) {
  const links = useMemo(() => note ? uniqueLinks(extractNoteLinks(note, notes)) : [], [note, notes])
  const backlinks = useMemo(() => note ? notes.filter((candidate) => !candidate.archived && extractNoteLinks(candidate, notes).some((link) => link.target?.id === note.id)) : [], [note, notes])
  if (!note) return <aside className={`inspector ${mobile ? 'mobile' : ''}`} />
  const area = areas.find((item) => item.key === note.area)
  return <aside className={`inspector ${mobile ? 'mobile' : ''}`}><div className="border-b border-line px-4 py-4"><p className="sidebar-label">Contexto</p><dl className="property-list"><div><dt>Área</dt><dd><i style={{ backgroundColor: area?.color }} />{area?.name}</dd></div><div><dt>Tipo</dt><dd>{note.kind === 'note' ? 'Nota' : note.kind === 'index' ? 'Índice' : 'Registro'}</dd></div><div><dt>Versión</dt><dd>{note.version}</dd></div><div><dt>Actualizó</dt><dd className="truncate">{note.updatedBy}</dd></div></dl></div><InspectorSection title="Enlaces salientes" count={links.length}>{links.map((link) => <button key={link.title} className={`connection ${link.target ? '' : link.restricted ? 'restricted' : 'unresolved'}`} onClick={() => link.target && onOpenNote(link.target.slug)}><span className="connection-dot" style={{ backgroundColor: link.target ? areas.find((item) => item.key === link.target?.area)?.color : undefined }} /><span className="truncate">{link.title}</span>{!link.target && <em>{link.restricted ? 'Restringida' : 'Pendiente'}</em>}</button>)}</InspectorSection><InspectorSection title="Backlinks" count={backlinks.length}>{backlinks.map((item) => <button key={item.id} className="connection" onClick={() => onOpenNote(item.slug)}><span className="connection-dot" style={{ backgroundColor: areas.find((areaItem) => areaItem.key === item.area)?.color }} /><span className="truncate">{item.title}</span></button>)}</InspectorSection><div className="mt-auto border-t border-line p-3"><button className="bottom-nav" onClick={onGraph}><Network size={15} /> Ver en el grafo</button>{canDelete && note.kind === 'note' && <button className="bottom-nav danger" onClick={onDelete}><Trash2 size={15} /> Eliminar nota</button>}</div></aside>
}

function InspectorSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) { return <section className="border-b border-line px-3 py-4"><div className="mb-2 flex items-center justify-between px-1"><p className="sidebar-label !mb-0">{title}</p><span className="count-badge">{count}</span></div><div className="space-y-0.5">{children}{!count && <p className="px-2 py-3 text-xs text-muted">Sin conexiones todavía.</p>}</div></section> }

function NewNoteDialog({ areaName, onClose, onCreate }: { areaName: string; onClose: () => void; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('')

  return <div className="modal-backdrop">
    <form className="modal-card max-w-md p-6" onSubmit={(event) => { event.preventDefault(); if (title.trim()) void onCreate(title.trim()) }}>
      <p className="eyebrow">Nueva nota · {areaName}</p>
      <h2 className="mt-1 text-xl font-medium">¿Qué quieres documentar?</h2>
      <label className="mt-6 block">
        <span className="field-label">Título</span>
        <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="field" placeholder="Ej. Estrategia de búsqueda" />
      </label>
      <p className="mt-2 text-xs text-muted">El slug se generará automáticamente a partir del título.</p>
      <div role="note" className="mt-4 flex gap-3 rounded-lg border border-moss/20 bg-moss/5 px-3 py-3">
        <BookOpen size={16} className="mt-0.5 flex-none text-moss" />
        <div>
          <p className="text-xs font-medium text-stone-200">Recuerda revisar el índice del área</p>
          <p className="mt-1 text-xs leading-5 text-muted">Si esta nota debe ser fácil de descubrir, agrégala manualmente al índice correspondiente.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
        <button className="primary-button" disabled={!title.trim()}>Crear nota</button>
      </div>
    </form>
  </div>
}

function DeleteNoteDialog({ note, notes, onClose, onConfirm }: { note: Note; notes: Note[]; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const outgoing = uniqueLinks(extractNoteLinks(note, notes)).length
  const incoming = notes.filter((candidate) => !candidate.archived && candidate.id !== note.id && extractNoteLinks(candidate, notes).some((link) => link.target?.id === note.id)).length
  const total = outgoing + incoming
  async function confirm() {
    setLoading(true); setError('')
    try { await onConfirm() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la nota.'); setLoading(false) }
  }
  return <div className="modal-backdrop"><div className="modal-card max-w-lg p-6"><div className="flex items-start gap-4"><div className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300"><TriangleAlert size={19} /></div><div><p className="eyebrow text-red-300">Acción destructiva</p><h2 className="mt-1 text-xl font-medium">Eliminar “{note.title}”</h2><p className="mt-3 text-sm leading-6 text-muted">La nota dejará de estar disponible. Sus referencias en otras notas se convertirán en texto plano para que no queden enlaces pendientes.</p></div></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-line bg-ink/50 p-3 text-center"><div><strong className="block text-base text-stone-100">{incoming}</strong><span className="text-[10px] text-muted">Referencias entrantes</span></div><div><strong className="block text-base text-stone-100">{outgoing}</strong><span className="text-[10px] text-muted">Enlaces salientes</span></div><div><strong className="block text-base text-red-300">{total}</strong><span className="text-[10px] text-muted">Conexiones rotas</span></div></div>{error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button className="secondary-button" onClick={onClose} disabled={loading}>Cancelar</button><button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-400 px-4 text-xs font-semibold text-[#2a0b0b] transition hover:bg-red-300 disabled:opacity-50" onClick={() => void confirm()} disabled={loading}>{loading ? <span className="loader dark" /> : <><Trash2 size={14} /> Eliminar y romper conexiones</>}</button></div></div></div>
}

function EmptyState({ onCreate, canEdit }: { onCreate: () => void; canEdit: boolean }) { return <div className="grid flex-1 place-items-center"><div className="max-w-sm text-center"><FolderKanban size={28} className="mx-auto text-muted" /><h2 className="mt-4 font-medium">Tu espacio está listo</h2><p className="mt-2 text-sm text-muted">Abre una nota desde el explorador o recorre sus conexiones desde el grafo.</p>{canEdit && <button className="primary-button mx-auto mt-5" onClick={onCreate}><CirclePlus size={15} /> Crear nota</button>}</div></div> }
