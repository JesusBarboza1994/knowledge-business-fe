import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { Check, ChevronDown, Focus, Layers3, LocateFixed, Search, Waypoints, ZoomIn, ZoomOut } from 'lucide-react'
import type { Area, Note } from '../types'
import { extractWikiLinks, uniqueLinks } from '../lib/wiki'

interface KnowledgeGraphProps {
  notes: Note[]
  areas: Area[]
  selectedNote?: Note
  hoveredNoteSlug?: string
  onOpenNote: (slug: string) => void
}

export function KnowledgeGraph({ notes, areas, selectedNote, hoveredNoteSlug, onOpenNote }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [scope, setScope] = useState<'local' | 'selection' | 'all'>('selection')
  const [selectedAreaKeys, setSelectedAreaKeys] = useState<string[]>(
    selectedNote ? [selectedNote.area] : areas[0] ? [areas[0].key] : [],
  )
  const [query, setQuery] = useState('')

  const activeNotes = useMemo(
    () => notes.filter((note) => !note.archived && (scope !== 'selection' || selectedAreaKeys.includes(note.area))),
    [notes, scope, selectedAreaKeys],
  )

  const elements = useMemo<ElementDefinition[]>(() => {
    let visible = activeNotes
    if (scope === 'local' && selectedNote) {
      const related = new Set<string>([selectedNote.slug])
      uniqueLinks(extractWikiLinks(selectedNote.body, notes)).forEach((link) => {
        related.add(link.target?.slug ?? `pending:${link.title}`)
      })
      notes.forEach((note) => {
        if (extractWikiLinks(note.body, notes).some((link) => link.target?.id === selectedNote.id)) {
          related.add(note.slug)
        }
      })
      visible = notes.filter((note) => !note.archived && related.has(note.slug))
    }

    const visibleSlugs = new Set(visible.map((note) => note.slug))
    const linksByNote = new Map(visible.map((note) => [note.slug, uniqueLinks(extractWikiLinks(note.body, notes))]))
    const degrees = new Map(visible.map((note) => [note.slug, 0]))

    visible.forEach((note) => {
      linksByNote.get(note.slug)?.forEach((link) => {
        if (!link.target || !visibleSlugs.has(link.target.slug)) return
        degrees.set(note.slug, (degrees.get(note.slug) ?? 0) + 1)
        degrees.set(link.target.slug, (degrees.get(link.target.slug) ?? 0) + 1)
      })
    })

    const areaKeys = new Set(visible.map((note) => note.area))
    const result: ElementDefinition[] = areas
      .filter((area) => areaKeys.has(area.key))
      .map((area) => ({
        data: {
          id: `area:${area.key}`,
          label: area.name,
          eyebrow: 'ÁREA',
          type: 'area',
          color: area.color,
          size: 34,
          rank: scope === 'local' ? 82 : 100,
        },
      }))

    visible.forEach((note) => {
      const color = areas.find((area) => area.key === note.area)?.color ?? '#b7e66b'
      const isSelected = note.id === selectedNote?.id
      const degree = degrees.get(note.slug) ?? 0
      const baseSize = note.kind === 'index' ? 19 : note.kind === 'log' ? 16 : 13
      const size = Math.min(baseSize + degree * 1.15 + (isSelected ? 2 : 0), 25)
      const rank = isSelected ? (scope === 'local' ? 100 : 88) : note.kind === 'index' ? 76 : 56

      result.push({
        data: {
          id: note.slug,
          label: note.title,
          area: note.area,
          type: note.kind,
          color,
          size,
          rank,
          selected: isSelected ? 'yes' : 'no',
        },
      })
      result.push({
        data: {
          id: `membership:${note.slug}`,
          source: `area:${note.area}`,
          target: note.slug,
          type: 'membership',
          color,
        },
      })
    })

    visible.forEach((note) => {
      linksByNote.get(note.slug)?.forEach((link, index) => {
        const pendingId = `pending:${link.title}`
        if (!link.target && !result.some((item) => item.data.id === pendingId)) {
          result.push({
            data: {
              id: pendingId,
              label: link.title,
              type: 'pending',
              color: '#747b6f',
              size: 11,
              rank: 18,
            },
          })
        }

        const target = link.target?.slug ?? pendingId
        if (!result.some((item) => item.data.id === target)) return
        const targetArea = link.target ? areas.find((area) => area.key === link.target?.area) : undefined
        const crossArea = Boolean(link.target && link.target.area !== note.area)
        result.push({
          data: {
            id: `link:${note.slug}:${target}:${index}`,
            source: note.slug,
            target,
            type: !link.target ? 'unresolved' : crossArea ? 'cross-area' : 'link',
            color: targetArea?.color ?? '#8ea078',
          },
        })
      })
    })

    const nodeElements = result.filter((element) => !element.data.source)
    const positioned = new Set<string>()
    const position = (element: ElementDefinition, x: number, y: number) => {
      element.position = { x, y }
      positioned.add(String(element.data.id))
    }
    const placeRing = (ring: ElementDefinition[], radius: number, offset = -Math.PI / 2) => {
      const sorted = [...ring].sort((a, b) => String(a.data.label).localeCompare(String(b.data.label)))
      sorted.forEach((element, index) => {
        const angle = offset + (Math.PI * 2 * index) / Math.max(sorted.length, 1)
        position(element, Math.cos(angle) * radius, Math.sin(angle) * radius)
      })
    }

    if (scope === 'local') {
      const center = nodeElements.find((element) => element.data.id === selectedNote?.slug)
      if (center) position(center, 0, 0)

      const hubs = nodeElements.filter((element) => element.data.type === 'area')
      placeRing(hubs, 88, -Math.PI / 3)

      const featured = nodeElements.filter(
        (element) =>
          !positioned.has(String(element.data.id)) &&
          (element.data.selected === 'yes' || element.data.type === 'index'),
      )
      placeRing(featured, 128)

      const regular = nodeElements.filter(
        (element) => !positioned.has(String(element.data.id)) && element.data.type !== 'pending',
      )
      placeRing(regular, Math.max(170, regular.length * 24))

      const pending = nodeElements.filter(
        (element) => !positioned.has(String(element.data.id)) && element.data.type === 'pending',
      )
      placeRing(pending, Math.max(235, pending.length * 27), -Math.PI / 2 + 0.3)
    } else {
      const areaNodes = nodeElements
        .filter((element) => element.data.type === 'area')
        .sort((a, b) => String(a.data.label).localeCompare(String(b.data.label)))
      const columns = Math.max(1, Math.ceil(Math.sqrt(areaNodes.length)))
      const rows = Math.max(1, Math.ceil(areaNodes.length / columns))
      const cellWidth = 390
      const cellHeight = 340
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))

      areaNodes.forEach((areaNode, areaIndex) => {
        const column = areaIndex % columns
        const row = Math.floor(areaIndex / columns)
        const centerX = (column - (columns - 1) / 2) * cellWidth
        const centerY = (row - (rows - 1) / 2) * cellHeight
        position(areaNode, centerX, centerY)

        const areaKey = String(areaNode.data.id).slice(5)
        const members = nodeElements
          .filter((element) => element.data.area === areaKey)
          .sort((a, b) => {
            const typeOrder = { index: 0, log: 1, note: 2 }
            const order = (typeOrder[String(a.data.type) as keyof typeof typeOrder] ?? 3) -
              (typeOrder[String(b.data.type) as keyof typeof typeOrder] ?? 3)
            return order || String(a.data.label).localeCompare(String(b.data.label))
          })

        members.forEach((element, index) => {
          const angle = index * goldenAngle - Math.PI / 2
          const radius = 62 + Math.sqrt(index) * 34
          position(element, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
        })
      })

      const pending = nodeElements.filter((element) => element.data.type === 'pending')
      const mapRadius = Math.max(columns * cellWidth, rows * cellHeight) / 2 + 150
      placeRing(pending, Math.max(mapRadius, pending.length * 18), -Math.PI / 2 + 0.2)
    }

    return result
  }, [activeNotes, areas, notes, scope, selectedNote])

  const stats = useMemo(() => {
    const nodes = elements.filter((element) => !element.data.source)
    const edges = elements.filter((element) => element.data.source && element.data.type !== 'membership')
    return {
      areas: nodes.filter((element) => element.data.type === 'area').length,
      notes: nodes.filter((element) => ['note', 'index', 'log'].includes(String(element.data.type))).length,
      connections: edges.length,
      pending: nodes.filter((element) => element.data.type === 'pending').length,
    }
  }, [elements])

  useEffect(() => {
    if (!containerRef.current) return
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 0.9,
            label: 'data(label)',
            color: '#dfe4da',
            'font-family': 'Inter, sans-serif',
            'font-size': '9px',
            'font-weight': 500,
            'min-zoomed-font-size': 8,
            'text-wrap': 'wrap',
            'text-max-width': '96px',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-background-color': '#10120e',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            width: 'data(size)',
            height: 'data(size)',
            'border-width': 2,
            'border-color': '#1b1f18',
            'overlay-opacity': 0,
            'transition-property': 'opacity, border-width, border-color, width, height',
            'transition-duration': 140,
          },
        },
        {
          selector: 'node[type="area"]',
          style: {
            shape: 'round-rectangle',
            'background-opacity': 0.2,
            'border-width': 2,
            'border-color': 'data(color)',
            'font-size': '11px',
            'font-weight': 600,
            'text-margin-y': 9,
            'underlay-color': 'data(color)',
            'underlay-opacity': 0.08,
            'underlay-padding': 11,
          },
        },
        {
          selector: 'node[type="index"]',
          style: { shape: 'diamond', 'background-opacity': 0.28, 'border-width': 2, 'border-color': 'data(color)' },
        },
        {
          selector: 'node[type="log"]',
          style: { shape: 'round-rectangle', 'background-opacity': 0.55 },
        },
        {
          selector: 'node[type="pending"]',
          style: {
            'background-opacity': 0.04,
            'border-width': 1.5,
            'border-style': 'dashed',
            'border-color': '#747b6f',
            color: '#8d9487',
            'text-background-opacity': 0.72,
          },
        },
        {
          selector: 'node[selected="yes"]',
          style: {
            'border-width': 3,
            'border-color': '#f1f6e9',
            'underlay-color': 'data(color)',
            'underlay-opacity': 0.16,
            'underlay-padding': 8,
            'font-weight': 600,
          },
        },
        {
          selector: 'node.hovered',
          style: { 'border-width': 3, 'border-color': '#f1f6e9', 'underlay-opacity': 0.13, 'underlay-padding': 7 },
        },
        {
          selector: 'node.sidebar-hovered',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'underlay-color': 'data(color)',
            'underlay-opacity': 0.34,
            'underlay-padding': 13,
            'font-size': '11px',
            'font-weight': 700,
            'text-background-opacity': 1,
            'z-index': 999,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.35,
            'line-color': '#718066',
            'target-arrow-color': '#718066',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.5,
            'arrow-scale': 0.55,
            'overlay-opacity': 0,
            'transition-property': 'opacity, width, line-color',
            'transition-duration': 140,
          },
        },
        {
          selector: 'edge[type="membership"]',
          style: {
            'line-color': 'data(color)',
            'target-arrow-shape': 'none',
            'curve-style': 'straight',
            opacity: 0.14,
            width: 2.5,
          },
        },
        {
          selector: 'edge[type="cross-area"]',
          style: { 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', opacity: 0.82, width: 2 },
        },
        {
          selector: 'edge[type="unresolved"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#666e62',
            'target-arrow-color': '#666e62',
            opacity: 0.42,
          },
        },
        { selector: '.faded', style: { opacity: 0.1 } },
        { selector: 'edge.focused', style: { opacity: 0.95, width: 2.4 } },
        { selector: 'edge.sidebar-focused', style: { opacity: 1, width: 2.6, 'z-index': 998 } },
        {
          selector: '.found',
          style: { 'border-color': '#ffffff', 'border-width': 4, 'underlay-color': '#ffffff', 'underlay-opacity': 0.1 },
        },
      ],
      layout: { name: 'preset', animate: false, fit: true, padding: 54 },
      minZoom: 0.08,
      maxZoom: 3,
      boxSelectionEnabled: false,
    })

    cy.on('tap', 'node', (event) => {
      const node = event.target
      const id = node.id()
      if (id.startsWith('area:')) {
        cy.animate({ fit: { eles: node.closedNeighborhood(), padding: 110 }, duration: 280 })
        return
      }
      if (!id.startsWith('pending:')) onOpenNote(id)
    })
    cy.on('tap', (event) => {
      if (event.target === cy) cy.animate({ fit: { eles: cy.elements(), padding: 72 }, duration: 240 })
    })
    cy.on('mouseover', 'node', (event) => {
      const node = event.target
      const neighborhood = node.closedNeighborhood()
      cy.elements().addClass('faded')
      neighborhood.removeClass('faded')
      neighborhood.edges().addClass('focused')
      node.addClass('hovered')
      if (containerRef.current) containerRef.current.style.cursor = 'pointer'
    })
    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('faded focused hovered')
      if (containerRef.current) containerRef.current.style.cursor = 'default'
    })
    cyRef.current = cy
    return () => cy.destroy()
  }, [elements, onOpenNote])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().removeClass('sidebar-hovered')
    cy.edges().removeClass('sidebar-focused')
    if (!hoveredNoteSlug) return
    const node = cy.getElementById(hoveredNoteSlug)
    if (!node.length) return
    node.addClass('sidebar-hovered')
    node.connectedEdges().addClass('sidebar-focused')
  }, [elements, hoveredNoteSlug])

  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().removeClass('found')
    if (!query.trim()) {
      cy.animate({ fit: { eles: cy.elements(), padding: 72 }, duration: 220 })
      return
    }
    const found = cy.nodes().filter((node) => String(node.data('label')).toLowerCase().includes(query.toLowerCase()))
    found.addClass('found')
    if (found.length) cy.animate({ fit: { eles: found, padding: 150 }, duration: 240 })
  }, [query])

  const zoomBy = (amount: number) => {
    const cy = cyRef.current
    if (!cy) return
    cy.animate({ zoom: Math.max(0.08, Math.min(3, cy.zoom() + amount)), duration: 170 })
  }
  const toggleArea = (key: string) => {
    setSelectedAreaKeys((current) => {
      if (current.includes(key)) return current.length === 1 ? current : current.filter((areaKey) => areaKey !== key)
      return [...current, key]
    })
    setScope('selection')
  }
  const scopeTitle = scope === 'local'
    ? `Alrededor de ${selectedNote?.title ?? 'la nota'}`
    : scope === 'all'
      ? 'Toda la organización'
      : selectedAreaKeys.length === 1
        ? `Área ${areas.find((area) => area.key === selectedAreaKeys[0])?.name ?? ''}`
        : `${selectedAreaKeys.length} áreas seleccionadas`

  return (
    <div className="graph-shell relative flex min-h-0 flex-1 flex-col">
      <header className="graph-header">
        <div className="graph-title-icon"><Waypoints size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Mapa de conocimiento</p>
          <div className="mt-0.5 flex items-center gap-3">
            <h2 className="truncate font-medium">{scopeTitle}</h2>
            <span className="graph-count">{stats.areas} áreas</span>
            <span className="graph-count">{stats.notes} notas</span>
            <span className="graph-count">{stats.connections} conexiones</span>
            {stats.pending > 0 && <span className="graph-count pending">{stats.pending} pendientes</span>}
          </div>
        </div>
        <details className="graph-area-picker">
          <summary>
            <Layers3 size={13} />
            Áreas
            <span>{selectedAreaKeys.length}</span>
            <ChevronDown size={12} />
          </summary>
          <div>
            {areas.map((area) => (
              <label key={area.key}>
                <input
                  type="checkbox"
                  checked={selectedAreaKeys.includes(area.key)}
                  onChange={() => toggleArea(area.key)}
                />
                <i style={{ backgroundColor: area.color }} />
                <span>{area.name}</span>
                {selectedAreaKeys.includes(area.key) && <Check size={12} />}
              </label>
            ))}
          </div>
        </details>
        <div className="segmented">
          <button className={scope === 'local' ? 'active' : ''} onClick={() => setScope('local')}>
            <Focus size={13} /> Local
          </button>
          <button className={scope === 'selection' ? 'active' : ''} onClick={() => setScope('selection')}>
            <Waypoints size={13} /> Selección
          </button>
          <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>
            <Layers3 size={13} /> Todas
          </button>
        </div>
      </header>

      <div ref={containerRef} className="graph-canvas min-h-0 flex-1" aria-label="Grafo interactivo de conocimiento" />

      <label className="graph-search">
        <Search size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en el mapa…" />
        {query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda">×</button>}
      </label>

      <div className="graph-tools">
        <button title="Acercar" onClick={() => zoomBy(0.18)}><ZoomIn size={16} /></button>
        <button title="Alejar" onClick={() => zoomBy(-0.18)}><ZoomOut size={16} /></button>
        <span />
        <button title="Centrar mapa" onClick={() => cyRef.current?.animate({ fit: { eles: cyRef.current.elements(), padding: 72 }, duration: 240 })}><LocateFixed size={16} /></button>
      </div>

      <div className="graph-legend">
        <span><i className="area" /> Área</span>
        <span><i className="note" /> Nota</span>
        <span><i className="index" /> Índice</span>
        <span><i className="pending" /> Sin resolver</span>
        <span className="legend-divider" />
        <span><b className="link-line" /> Enlace</span>
        <span><b className="area-line" /> Pertenece al área</span>
      </div>
    </div>
  )
}
