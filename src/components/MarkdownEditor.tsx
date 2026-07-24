import { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, ChevronDown, Columns2, Eye, FileClock, Pencil, Save, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import { markdownWithWikiLinks, noteReferenceFromHref, resolveNoteHref, wikiLinkCompletion } from '../lib/wiki'
import { api } from '../services/api'
import type { Area, Note, NoteVersion, Sensitivity } from '../types'

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

interface Props {
  note: Note
  notes: Note[]
  areas: Area[]
  canEdit: boolean
  onSaved: (note: Note) => void
  onOpenNote: (slug: string) => void
}

export function MarkdownEditor({ note, notes, areas, canEdit, onSaved, onOpenNote }: Props) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [sensitivity, setSensitivity] = useState<Sensitivity>(note.sensitivity)
  const [visibleTo, setVisibleTo] = useState(note.visibleTo)
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>(canEdit ? 'edit' : 'preview')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyVersions, setHistoryVersions] = useState<NoteVersion[] | null>(null)
  const [conflict, setConflict] = useState<Note | null>(null)
  const baseVersion = useRef(note.version)
  const dirty = useRef(false)

  useEffect(() => {
    setTitle(note.title); setBody(note.body); setSensitivity(note.sensitivity); setVisibleTo(note.visibleTo)
    baseVersion.current = note.version; dirty.current = false; setSaveState('saved')
    if (!canEdit) setMode('preview')
  }, [note.id, note.version, note.title, note.body, note.sensitivity, note.visibleTo, canEdit])

  const extensions = useMemo(() => {
    const wikiCompletion = (context: CompletionContext) => {
      const before = context.state.sliceDoc(Math.max(0, context.pos - 80), context.pos)
      const match = before.match(/\[\[([^\]]*)$/)
      if (!match) return null
      const followingText = context.state.sliceDoc(context.pos, context.pos + 2)
      return {
        from: context.pos - match[1].length,
        options: notes.filter((item) => !item.archived).map((item) => ({
          label: item.title,
          detail: areas.find((area) => area.key === item.area)?.name,
          type: item.kind === 'note' ? 'text' : 'keyword',
          apply: wikiLinkCompletion(item.title, followingText),
        })),
      }
    }
    return [markdown(), autocompletion({ override: [wikiCompletion], activateOnTyping: true })]
  }, [notes, areas])

  function changed() { dirty.current = true; setSaveState('dirty') }

  async function save(forceVersion?: number) {
    if (!canEdit || !dirty.current) return
    setSaveState('saving')
    try {
      const saved = await api.saveNote(note.id, { title, body, sensitivity, visibleTo }, forceVersion ?? baseVersion.current)
      baseVersion.current = saved.version; dirty.current = false; setSaveState('saved'); setConflict(null); onSaved(saved)
    } catch (reason) {
      if (reason instanceof Error && reason.message === 'VERSION_CONFLICT') {
        const remote = (await api.getNotes()).find((item) => item.id === note.id)
        if (remote) setConflict(remote)
      }
      setSaveState('error')
    }
  }

  async function openHistory() {
    setHistoryOpen(true)
    try { setHistoryVersions(await api.getVersions(note.slug)) }
    catch { setHistoryVersions(note.versions) }
  }

  useEffect(() => {
    if (!dirty.current || !canEdit) return
    const timer = window.setTimeout(() => void save(), 1200)
    return () => window.clearTimeout(timer)
    // Inputs intentionally drive autosave; save is stable enough for this local adapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, sensitivity, visibleTo, canEdit])

  const status = {
    saved: <><Check size={13} /> Guardado</>, dirty: <>Cambios pendientes</>, saving: <><span className="loader small" /> Guardando</>, error: <><TriangleAlert size={13} /> Revisa el conflicto</>,
  }[saveState]

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#141611]">
      <header className="editor-header flex min-h-[62px] items-center gap-3 border-b border-line px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[.15em] text-muted">
            {note.kind !== 'note' && <span className="rounded bg-moss/10 px-1.5 py-0.5 text-moss">{note.kind === 'index' ? 'Índice del área' : 'Registro del área'}</span>}
            <span>v{baseVersion.current}</span>
          </div>
          <input value={title} readOnly={!canEdit} onChange={(event) => { setTitle(event.target.value); changed() }} className="w-full truncate border-0 bg-transparent p-0 text-lg font-medium text-stone-100 outline-none ring-0 focus:ring-0" />
        </div>
        <div className={`save-status ${saveState}`}>{status}</div>
        <button className="icon-button" title="Historial" onClick={() => void openHistory()}><FileClock size={17} /></button>
        {canEdit && <button className="icon-button" title="Guardar ahora" onClick={() => void save()}><Save size={17} /></button>}
        <div className="hidden rounded-lg border border-line bg-[#10120e] p-1 sm:flex">
          <button className={`mode-button ${mode === 'edit' ? 'active' : ''}`} title="Editar" onClick={() => setMode('edit')} disabled={!canEdit}><Pencil size={14} /></button>
          <button className={`mode-button ${mode === 'split' ? 'active' : ''}`} title="Dividir" onClick={() => setMode('split')} disabled={!canEdit}><Columns2 size={14} /></button>
          <button className={`mode-button ${mode === 'preview' ? 'active' : ''}`} title="Vista previa" onClick={() => setMode('preview')}><Eye size={14} /></button>
        </div>
      </header>
      <div className="mobile-editor-toolbar">
        {canEdit && <button className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}><Pencil size={15} /> Editar</button>}
        <button className={mode !== 'edit' ? 'active' : ''} onClick={() => setMode('preview')}><Eye size={15} /> Vista previa</button>
      </div>

      <div className={`editor-grid mode-${mode}`}>
        {mode !== 'preview' && (
          <div className="min-h-0 overflow-auto border-r border-line">
            <CodeMirror value={body} extensions={extensions} onChange={(value) => { setBody(value); changed() }} editable={canEdit} theme="dark" basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLineGutter: false }} className="min-h-full" />
          </div>
        )}
        {mode !== 'edit' && (
          <article className="markdown-body overflow-auto px-7 py-8 lg:px-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const reference = noteReferenceFromHref(href)
                  const link = resolveNoteHref(href, note, notes)
                  const target = link?.target
                  if (reference) {
                    return (
                      <button
                        type="button"
                        className={`wiki-link ${target ? '' : link?.restricted ? 'restricted' : 'unresolved'}`}
                        onClick={() => target && onOpenNote(target.slug)}
                        title={target ? `Abrir ${target.title}` : link?.restricted ? 'No tienes acceso a esta nota' : 'La nota referenciada todavía no existe'}
                      >
                        {children}
                      </button>
                    )
                  }
                  return <a href={href} target="_blank" rel="noreferrer">{children}</a>
                },
              }}
            >{markdownWithWikiLinks(body)}</ReactMarkdown>
          </article>
        )}
      </div>

      {canEdit && (
        <footer className="editor-settings-footer flex min-h-11 items-center gap-3 border-t border-line px-5 text-xs text-muted">
          <button className="mobile-editor-settings" onClick={() => setSettingsOpen(true)}><SlidersHorizontal size={15} /> Visibilidad y acceso</button>
          <span className="relative"><select value={sensitivity} onChange={(event) => { setSensitivity(event.target.value as Sensitivity); changed() }} className="appearance-none border-0 bg-transparent py-1 pl-0 pr-5 text-xs text-muted ring-0 focus:text-stone-200 focus:ring-0"><option value="public_org">Público en la organización</option><option value="internal_area">Interno del área</option><option value="confidential">Confidencial</option></select><ChevronDown size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" /></span>
          <span className="h-3 w-px bg-line" />
          <span>Visible en</span>
          {areas.map((area) => <label key={area.key} className="flex items-center gap-1.5"><input type="checkbox" checked={visibleTo.includes(area.key)} onChange={(event) => { setVisibleTo((current) => event.target.checked ? [...current, area.key] : current.filter((key) => key !== area.key)); changed() }} className="h-3.5 w-3.5 rounded border-line bg-ink text-moss focus:ring-moss/30" />{area.name}</label>)}
        </footer>
      )}

      {settingsOpen && <div className="mobile-sheet-backdrop" onClick={() => setSettingsOpen(false)}>
        <section className="mobile-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-sheet-handle" />
          <div className="mobile-sheet-head"><div><p className="eyebrow">Configuración</p><h2>Visibilidad de la nota</h2></div><button className="icon-button" aria-label="Cerrar visibilidad" onClick={() => setSettingsOpen(false)}><X size={18} /></button></div>
          <div className="space-y-5 px-5 pb-6">
            <label className="block"><span className="field-label">Sensibilidad</span><select value={sensitivity} onChange={(event) => { setSensitivity(event.target.value as Sensitivity); changed() }} className="field"><option value="public_org">Público en la organización</option><option value="internal_area">Interno del área</option><option value="confidential">Confidencial</option></select></label>
            <fieldset><legend className="field-label">Visible en áreas</legend><div className="space-y-2">{areas.map((area) => <label key={area.key} className="mobile-check-row"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color }} /><span className="min-w-0 flex-1 truncate">{area.name}</span><input type="checkbox" checked={visibleTo.includes(area.key)} onChange={(event) => { setVisibleTo((current) => event.target.checked ? [...current, area.key] : current.filter((key) => key !== area.key)); changed() }} /></label>)}</div></fieldset>
            <button className="primary-button h-11 w-full" onClick={() => setSettingsOpen(false)}>Listo</button>
          </div>
        </section>
      </div>}
      {historyOpen && <HistoryDialog note={{ ...note, versions: historyVersions ?? note.versions }} local={{ title, body }} onClose={() => setHistoryOpen(false)} />}
      {conflict && <ConflictDialog local={{ title, body }} remote={conflict} onKeepRemote={() => { setTitle(conflict.title); setBody(conflict.body); baseVersion.current = conflict.version; dirty.current = false; setConflict(null); setSaveState('saved'); onSaved(conflict) }} onKeepLocal={() => { baseVersion.current = conflict.version; dirty.current = true; void save(conflict.version) }} />}
    </div>
  )
}

function HistoryDialog({ note, local, onClose }: { note: Note; local: { title: string; body: string }; onClose: () => void }) {
  const previous = note.versions.find((version) => version.version < note.version) ?? note.versions[0]
  return <div className="modal-backdrop"><div className="modal-card max-w-5xl"><div className="modal-head"><div><p className="eyebrow">Historial</p><h2>Comparar versiones</h2></div><button className="text-muted hover:text-white" onClick={onClose}>Cerrar</button></div><div className="compare-grid"><ComparePane label={`Anterior · v${previous?.version ?? note.version}`} meta={previous ? `${previous.editedBy} · ${new Date(previous.editedAt).toLocaleString('es-PE')}` : 'No hay una versión anterior'} body={previous?.body ?? 'Esta es la primera versión de la nota.'} /><ComparePane label={`Actual · v${note.version}`} meta="Versión local" body={local.body} /></div></div></div>
}

function ConflictDialog({ local, remote, onKeepRemote, onKeepLocal }: { local: { title: string; body: string }; remote: Note; onKeepRemote: () => void; onKeepLocal: () => void }) {
  return <div className="modal-backdrop"><div className="modal-card max-w-5xl"><div className="modal-head"><div><p className="eyebrow text-amber-300">Conflicto de edición</p><h2>La nota cambió mientras editabas</h2><p>Compara ambas versiones antes de decidir. Nada se sobrescribirá automáticamente.</p></div></div><div className="compare-grid"><ComparePane label="Tus cambios" meta={local.title} body={local.body} /><ComparePane label={`Remota · v${remote.version}`} meta={`${remote.updatedBy} · ${new Date(remote.updatedAt).toLocaleString('es-PE')}`} body={remote.body} /></div><div className="flex justify-end gap-3 border-t border-line p-4"><button className="secondary-button" onClick={onKeepRemote}>Usar versión remota</button><button className="primary-button" onClick={onKeepLocal}>Conservar mis cambios</button></div></div></div>
}

function ComparePane({ label, meta, body }: { label: string; meta: string; body: string }) {
  return <section className="min-w-0"><div className="border-b border-line px-5 py-3"><strong className="text-sm">{label}</strong><p className="mt-1 text-xs text-muted">{meta}</p></div><pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-stone-300">{body}</pre></section>
}
