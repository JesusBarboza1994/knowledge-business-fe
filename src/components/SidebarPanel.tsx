import {
  BookOpen,
  ChevronDown,
  CirclePlus,
  File,
  FileClock,
  GitGraph,
  LayoutPanelLeft,
  LogOut,
  Search,
  Settings2,
  Shield,
  X,
} from 'lucide-react'
import { BrandMark } from './BrandMark'
import type { Area, MainView, Note, Session } from '../types'

interface Props {
  session: Session
  areas: Area[]
  activeArea: string
  notes: Note[]
  selectedId?: string
  view: MainView
  query: string
  canEdit: boolean
  mobileOpen: boolean
  onQueryChange: (value: string) => void
  onSwitchArea: (key: string) => void
  onViewChange: (view: MainView) => void
  onOpenNote: (id: string) => void
  onHoverNote: (slug?: string) => void
  onNewNote: () => void
  onCloseMobile: () => void
  onLogout: () => void
}

export function SidebarPanel({
  session,
  areas,
  activeArea,
  notes,
  selectedId,
  view,
  query,
  canEdit,
  mobileOpen,
  onQueryChange,
  onSwitchArea,
  onViewChange,
  onOpenNote,
  onHoverNote,
  onNewNote,
  onCloseMobile,
  onLogout,
}: Props) {
  const area = areas.find((item) => item.key === activeArea)

  return (
    <aside className={`workspace-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="flex min-h-[62px] items-center gap-3 border-b border-line px-4">
        <BrandMark className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <strong className="wordmark block truncate text-sm">KnowHub</strong>
          <span className="block truncate text-xs text-muted">{session.organizationName}</span>
        </div>
        <button className="icon-button lg:hidden" aria-label="Cerrar explorador" onClick={onCloseMobile}>
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-line p-3">
        <label className="sidebar-search">
          <Search size={14} />
          <input
            placeholder="Buscar notas…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <kbd>⌘K</kbd>
        </label>
      </div>

      <div className="border-b border-line p-3">
        <p className="sidebar-label">Área actual</p>
        <div className="relative">
          <select className="area-select" value={activeArea} onChange={(event) => onSwitchArea(event.target.value)}>
            {areas.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="area-color" style={{ backgroundColor: area?.color }} />
          <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-2xs text-muted">
          <span>{area?.noteCount} notas</span>
          <span className="uppercase tracking-label">Acceso: {area?.access}</span>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2">
          <button className={`nav-mode ${view === 'note' ? 'active' : ''}`} onClick={() => onViewChange('note')}>
            <LayoutPanelLeft size={14} /> Notas
          </button>
          <button className={`nav-mode ${view === 'graph' ? 'active' : ''}`} onClick={() => onViewChange('graph')}>
            <GitGraph size={14} /> Grafo
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="sidebar-label !mb-0">{query ? 'Resultados' : 'Documentos'}</p>
            {canEdit && (
              <button className="text-muted hover:text-accent" title="Nueva nota" onClick={onNewNote}>
                <CirclePlus size={15} />
              </button>
            )}
          </div>
          {notes.length ? (
            notes.map((note) => (
              <button
                key={note.id}
                className={`note-row ${selectedId === note.id && view === 'note' ? 'active' : ''}`}
                onMouseEnter={() => onHoverNote(note.slug)}
                onMouseLeave={() => onHoverNote(undefined)}
                onFocus={() => onHoverNote(note.slug)}
                onBlur={() => onHoverNote(undefined)}
                onClick={() => onOpenNote(note.id)}
              >
                {note.kind === 'index' ? (
                  <BookOpen size={14} />
                ) : note.kind === 'log' ? (
                  <FileClock size={14} />
                ) : (
                  <File size={14} />
                )}
                <span className="truncate">{note.title}</span>
                {note.sensitivity === 'confidential' && <Shield size={11} className="ml-auto" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-xs text-muted">No encontramos notas.</div>
          )}
        </div>

        <div className="border-t border-line p-2">
          {session.role !== 'member' && (
            <button className={`bottom-nav ${view === 'admin' ? 'active' : ''}`} onClick={() => onViewChange('admin')}>
              <Settings2 size={15} /> Administrar organización
            </button>
          )}
          <button className="bottom-nav" onClick={onLogout}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </nav>
    </aside>
  )
}
