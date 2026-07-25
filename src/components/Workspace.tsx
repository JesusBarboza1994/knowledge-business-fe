import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CirclePlus,
  FileText,
  FolderKanban,
  GitGraph,
  Info,
  LayoutPanelLeft,
  LogOut,
  Menu,
  MoreHorizontal,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { AdminPanel } from "./AdminPanel";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { MarkdownEditor } from "./MarkdownEditor";
import { extractNoteLinks, uniqueLinks } from "../lib/wiki";
import { useDebounced } from "../lib/useDebounced";
import { api } from "../services/api";
import type { Area, MainView, Member, Note, Session } from "../types";
import { NewNoteDialog } from "./Modal/NewNoteModal";
import { DeleteNoteDialog } from "./Modal/DeleteNoteModal";
import { SidebarPanel } from "./SidebarPanel";

interface Props {
  session: Session;
  initialAreas: Area[];
  initialNotes: Note[];
  initialMembers: Member[];
  onLogout: () => void;
}

export function Workspace({
  session,
  initialAreas,
  initialNotes,
  initialMembers,
  onLogout,
}: Props) {
  const [areas, setAreas] = useState(initialAreas);
  const [notes, setNotes] = useState(initialNotes);
  const [members, setMembers] = useState(initialMembers);
  const [activeArea, setActiveArea] = useState(initialAreas[0]?.key ?? "");
  const firstNote =
    initialNotes.find(
      (note) => note.area === activeArea && note.kind === "index",
    ) ?? initialNotes[0];
  const [tabs, setTabs] = useState<string[]>(firstNote ? [firstNote.id] : []);
  const [selectedId, setSelectedId] = useState(firstNote?.id);
  const [view, setView] = useState<MainView>("note");
  const [query, setQuery] = useState("");
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);
  const [hoveredNoteSlug, setHoveredNoteSlug] = useState<string>();

  const queryClient = useQueryClient();

  const selectedSummary = notes.find((note) => note.id === selectedId);
  const openNoteQuery = useQuery({
    queryKey: ["note", selectedSummary?.slug],
    queryFn: () => api.getNote(selectedSummary!.slug),
    enabled: Boolean(selectedSummary),
  });
  const selectedNote = openNoteQuery.data ?? selectedSummary;

  const hoverNote = useCallback(
    (slug?: string) => {
      setHoveredNoteSlug(slug);
      if (slug)
        void queryClient.prefetchQuery({
          queryKey: ["note", slug],
          queryFn: () => api.getNote(slug),
        });
    },
    [queryClient],
  );

  const area = areas.find((item) => item.key === activeArea);
  const areaNotes = notes.filter(
    (note) => note.area === activeArea && !note.archived,
  );

  const typed = query.trim().toLowerCase();
  const searchTerm = useDebounced(typed);
  const search = useQuery({
    queryKey: ["search", searchTerm, activeArea],
    queryFn: () => api.searchNotes(searchTerm, activeArea),
    enabled: searchTerm.length > 2,
  });
  const filteredNotes = useMemo(() => {
    if (!typed) return areaNotes;

    const matchesName = (note: Note) =>
      note.title.toLowerCase().includes(typed) ||
      note.slug.includes(typed) ||
      (note.aliases ?? []).some((alias) => alias.toLowerCase().includes(typed));

    const byName = areaNotes.filter(matchesName);
    const named = new Set(byName.map((note) => note.id));
    const rank = new Map(
      (search.data ?? []).map((slug, index) => [slug, index]),
    );

    const byContent = areaNotes
      .filter((note) => !named.has(note.id) && rank.has(note.slug))
      .sort((a, b) => rank.get(a.slug)! - rank.get(b.slug)!);

    return [...byName, ...byContent];
  }, [areaNotes, search.data, typed]);

  const canEdit = area?.access === "write" || area?.access === "manage";
  const selectedArea = areas.find((item) => item.key === selectedNote?.area);

  const openNote = useCallback(
    (ref: string) => {
      const note = notes.find((item) => item.slug === ref || item.id === ref);
      if (!note || note.archived) return;
      setSelectedId(note.id);
      setActiveArea(note.area);
      setTabs((current) =>
        current.includes(note.id) ? current : [...current, note.id],
      );
      setView("note");
      setMobileNav(false);
      setHoveredNoteSlug(undefined);
    },
    [notes],
  );

  function closeTab(id: string) {
    setTabs((current) => {
      const index = current.indexOf(id);
      const next = current.filter((item) => item !== id);
      if (selectedId === id)
        setSelectedId(next[Math.min(index, next.length - 1)]);
      return next;
    });
  }

  function switchArea(key: string) {
    setActiveArea(key);
    const index =
      notes.find(
        (note) => note.area === key && note.kind === "index" && !note.archived,
      ) ?? notes.find((note) => note.area === key && !note.archived);
    if (index) openNote(index.id);
  }

  async function createNote(title: string) {
    const note = await api.createNote(activeArea, title);
    setNotes((current) => [note, ...current]);
    setNewNoteOpen(false);
    queryClient.setQueryData(["note", note.slug], note);
    setTabs((current) => [...current, note.id]);
    setSelectedId(note.id);
    setView("note");
  }

  function noteSaved(saved: Note) {
    setNotes((current) =>
      current.map((note) => (note.id === saved.id ? saved : note)),
    );
    queryClient.setQueryData(["note", saved.slug], saved);
  }

  async function deleteSelected() {
    if (!selectedNote) return;
    await api.archiveNote(selectedNote.id, selectedNote.version);
    queryClient.removeQueries({ queryKey: ["note", selectedNote.slug] });
    setNotes(await api.getNotes());
    setDeleteNoteOpen(false);
    closeTab(selectedNote.id);
  }

  return (
    <div className="workspace-root flex h-screen overflow-hidden bg-ink text-fg">
      {mobileNav && (
        <button
          className="mobile-drawer-backdrop"
          aria-label="Cerrar explorador"
          onClick={() => setMobileNav(false)}
        />
      )}
      <SidebarPanel
        session={session}
        areas={areas}
        activeArea={activeArea}
        notes={filteredNotes}
        selectedId={selectedId}
        view={view}
        query={query}
        canEdit={Boolean(canEdit)}
        mobileOpen={mobileNav}
        onQueryChange={setQuery}
        onSwitchArea={switchArea}
        onViewChange={setView}
        onOpenNote={openNote}
        onHoverNote={hoverNote}
        onNewNote={() => setNewNoteOpen(true)}
        onCloseMobile={() => setMobileNav(false)}
        onLogout={onLogout}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="workspace-tabs flex min-h-10 items-center border-b border-line bg-ink">
          <button
            className="mx-2 grid h-10 w-8 place-items-center text-muted lg:hidden"
            aria-label="Abrir explorador"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={18} />
          </button>
          <div className="mobile-current-note min-w-0 flex-1 px-1">
            <span className="block truncate text-xs font-medium text-fg">
              {view === "graph"
                ? "Mapa de conocimiento"
                : view === "admin"
                  ? "Administración"
                  : (selectedNote?.title ?? "Notas")}
            </span>
            <span className="block truncate text-2xs uppercase tracking-label text-muted">
              {view === "note" ? selectedArea?.name : session.organizationName}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 self-stretch overflow-x-auto">
            {tabs.map((id) => {
              const note = notes.find((item) => item.id === id);
              if (!note) return null;
              return (
                <button
                  key={id}
                  className={`tab ${selectedId === id && view === "note" ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(id);
                    setActiveArea(note.area);
                    setView("note");
                  }}
                >
                  <FileText size={12} />
                  <span className="max-w-36 truncate">{note.title}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(id);
                    }}
                    className="tab-close"
                  >
                    <X size={11} />
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className="icon-button mx-2 hidden lg:grid"
            onClick={() => setRightOpen((value) => !value)}
            title="Alternar panel de contexto"
          >
            {rightOpen ? (
              <PanelRightClose size={16} />
            ) : (
              <PanelRightOpen size={16} />
            )}
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {view === "admin" ? (
            <AdminPanel
              currentUserId={session.userId}
              members={members}
              areas={areas}
              onMemberSaved={(member) =>
                setMembers((current) =>
                  current.some((item) => item.id === member.id)
                    ? current.map((item) =>
                        item.id === member.id ? member : item,
                      )
                    : [...current, member],
                )
              }
              onAreaSaved={(saved, created) => {
                setAreas((current) =>
                  current.some((item) => item.key === saved.key)
                    ? current.map((item) =>
                        item.key === saved.key ? saved : item,
                      )
                    : [...current, saved],
                );
                if (created) void api.getNotes().then(setNotes);
              }}
            />
          ) : view === "graph" ? (
            <KnowledgeGraph
              notes={notes}
              areas={areas}
              selectedNote={selectedNote}
              hoveredNoteSlug={hoveredNoteSlug}
              onOpenNote={openNote}
            />
          ) : openNoteQuery.data ? (
            <MarkdownEditor
              note={openNoteQuery.data}
              notes={notes}
              areas={areas}
              canEdit={canEdit}
              onSaved={noteSaved}
              onOpenNote={openNote}
            />
          ) : selectedSummary ? (
            <div className="grid flex-1 place-items-center text-sm text-muted">
              <span className="flex items-center gap-3">
                {openNoteQuery.isError ? (
                  "No se pudo abrir la nota."
                ) : (
                  <>
                    <span className="loader" /> Abriendo {selectedSummary.title}
                    …
                  </>
                )}
              </span>
            </div>
          ) : (
            <EmptyState
              onCreate={() => setNewNoteOpen(true)}
              canEdit={Boolean(canEdit)}
            />
          )}
          {rightOpen && view !== "admin" && (
            <Inspector
              note={selectedNote}
              notes={notes}
              areas={areas}
              onOpenNote={openNote}
              onGraph={() => setView("graph")}
              onDelete={() => setDeleteNoteOpen(true)}
              canDelete={selectedArea?.access === "manage"}
            />
          )}
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        <button
          className={view === "note" ? "active" : ""}
          onClick={() => {
            setView("note");
            setMobileNav(true);
            setMobileMore(false);
          }}
        >
          <LayoutPanelLeft size={19} />
          <span>Notas</span>
        </button>
        <button
          className={view === "graph" ? "active" : ""}
          onClick={() => {
            setView("graph");
            setMobileNav(false);
            setMobileMore(false);
          }}
        >
          <GitGraph size={19} />
          <span>Grafo</span>
        </button>
        <button
          className={mobileMore ? "active" : ""}
          onClick={() => setMobileMore(true)}
        >
          <MoreHorizontal size={20} />
          <span>Más</span>
        </button>
      </nav>
      {mobileMore && (
        <div
          className="mobile-sheet-backdrop"
          onClick={() => setMobileMore(false)}
        >
          <section
            className="mobile-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-head">
              <div>
                <p className="eyebrow">Opciones</p>
                <h2>Más acciones</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Cerrar opciones"
                onClick={() => setMobileMore(false)}
              >
                <X size={18} />
              </button>
            </div>
            {view !== "admin" && (
              <button
                className="mobile-sheet-action"
                onClick={() => {
                  setMobileMore(false);
                  setMobileInspector(true);
                }}
              >
                <Info size={18} />
                <span>
                  <strong>Contexto de la nota</strong>
                  <small>Propiedades, enlaces y backlinks</small>
                </span>
              </button>
            )}
            {session.role !== "member" && (
              <button
                className="mobile-sheet-action"
                onClick={() => {
                  setView("admin");
                  setMobileMore(false);
                }}
              >
                <Settings2 size={18} />
                <span>
                  <strong>Administrar organización</strong>
                  <small>Personas, áreas y permisos</small>
                </span>
              </button>
            )}
            <button className="mobile-sheet-action danger" onClick={onLogout}>
              <LogOut size={18} />
              <span>
                <strong>Cerrar sesión</strong>
                <small>Salir de Knowvault</small>
              </span>
            </button>
          </section>
        </div>
      )}
      {mobileInspector && (
        <div
          className="mobile-sheet-backdrop"
          onClick={() => setMobileInspector(false)}
        >
          <section
            className="mobile-sheet mobile-inspector-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-head">
              <div>
                <p className="eyebrow">Nota seleccionada</p>
                <h2 className="truncate">
                  {selectedNote?.title ?? "Contexto"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Cerrar contexto"
                onClick={() => setMobileInspector(false)}
              >
                <X size={18} />
              </button>
            </div>
            <Inspector
              mobile
              note={selectedNote}
              notes={notes}
              areas={areas}
              onOpenNote={(slug) => {
                setMobileInspector(false);
                openNote(slug);
              }}
              onGraph={() => {
                setMobileInspector(false);
                setView("graph");
              }}
              onDelete={() => {
                setMobileInspector(false);
                setDeleteNoteOpen(true);
              }}
              canDelete={selectedArea?.access === "manage"}
            />
          </section>
        </div>
      )}
      {newNoteOpen && (
        <NewNoteDialog
          onClose={() => setNewNoteOpen(false)}
          onCreate={createNote}
          areaName={area?.name ?? ""}
        />
      )}
      {deleteNoteOpen && selectedNote && (
        <DeleteNoteDialog
          note={selectedNote}
          notes={notes}
          onClose={() => setDeleteNoteOpen(false)}
          onConfirm={deleteSelected}
        />
      )}
    </div>
  );
}

function Inspector({
  note,
  notes,
  areas,
  onOpenNote,
  onGraph,
  onDelete,
  canDelete,
  mobile = false,
}: {
  note?: Note;
  notes: Note[];
  areas: Area[];
  onOpenNote: (slug: string) => void;
  onGraph: () => void;
  onDelete: () => void;
  canDelete: boolean;
  mobile?: boolean;
}) {
  const links = useMemo(
    () => (note ? uniqueLinks(extractNoteLinks(note, notes)) : []),
    [note, notes],
  );
  const backlinks = useMemo(
    () =>
      note
        ? notes.filter(
            (candidate) =>
              !candidate.archived &&
              extractNoteLinks(candidate, notes).some(
                (link) => link.target?.id === note.id,
              ),
          )
        : [],
    [note, notes],
  );
  if (!note) return <aside className={`inspector ${mobile ? "mobile" : ""}`} />;
  const area = areas.find((item) => item.key === note.area);
  return (
    <aside className={`inspector ${mobile ? "mobile" : ""}`}>
      <div className="border-b border-line px-4 py-4">
        <p className="sidebar-label">Contexto</p>
        <dl className="property-list">
          <div>
            <dt>Área</dt>
            <dd>
              <i style={{ backgroundColor: area?.color }} />
              {area?.name}
            </dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>
              {note.kind === "note"
                ? "Nota"
                : note.kind === "index"
                  ? "Índice"
                  : "Registro"}
            </dd>
          </div>
          <div>
            <dt>Versión</dt>
            <dd>{note.version}</dd>
          </div>
          <div>
            <dt>Actualizó</dt>
            <dd className="truncate">{note.updatedBy}</dd>
          </div>
        </dl>
      </div>
      <InspectorSection title="Enlaces salientes" count={links.length}>
        {links.map((link) => (
          <button
            key={link.title}
            className={`connection ${link.target ? "" : link.restricted ? "restricted" : "unresolved"}`}
            onClick={() => link.target && onOpenNote(link.target.slug)}
          >
            <span
              className="connection-dot"
              style={{
                backgroundColor: link.target
                  ? areas.find((item) => item.key === link.target?.area)?.color
                  : undefined,
              }}
            />
            <span className="truncate">{link.title}</span>
            {!link.target && (
              <em>{link.restricted ? "Restringida" : "Pendiente"}</em>
            )}
          </button>
        ))}
      </InspectorSection>
      <InspectorSection title="Backlinks" count={backlinks.length}>
        {backlinks.map((item) => (
          <button
            key={item.id}
            className="connection"
            onClick={() => onOpenNote(item.slug)}
          >
            <span
              className="connection-dot"
              style={{
                backgroundColor: areas.find(
                  (areaItem) => areaItem.key === item.area,
                )?.color,
              }}
            />
            <span className="truncate">{item.title}</span>
          </button>
        ))}
      </InspectorSection>
      <div className="mt-auto border-t border-line p-3">
        <button className="bottom-nav" onClick={onGraph}>
          <Network size={15} /> Ver en el grafo
        </button>
        {canDelete && note.kind === "note" && (
          <button className="bottom-nav danger" onClick={onDelete}>
            <Trash2 size={15} /> Eliminar nota
          </button>
        )}
      </div>
    </aside>
  );
}

function InspectorSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line px-3 py-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="sidebar-label !mb-0">{title}</p>
        <span className="count-badge">{count}</span>
      </div>
      <div className="space-y-0.5">
        {children}
        {!count && (
          <p className="px-2 py-3 text-xs text-muted">
            Sin conexiones todavía.
          </p>
        )}
      </div>
    </section>
  );
}

function EmptyState({
  onCreate,
  canEdit,
}: {
  onCreate: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="max-w-sm text-center">
        <FolderKanban size={28} className="mx-auto text-muted" />
        <h2 className="mt-4 font-medium">Tu espacio está listo</h2>
        <p className="mt-2 text-sm text-muted">
          Abre una nota desde el explorador o recorre sus conexiones desde el
          grafo.
        </p>
        {canEdit && (
          <button className="primary-button mx-auto mt-5" onClick={onCreate}>
            <CirclePlus size={15} /> Crear nota
          </button>
        )}
      </div>
    </div>
  );
}
