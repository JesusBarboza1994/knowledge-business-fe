import { describe, expect, it } from 'vitest'
import type { Note } from '../types'
import { includeSelectionConnection, selectionGraphNotes } from './graph'

function note(id: string, area: string, target?: Note): Note {
  return {
    id,
    area,
    slug: id,
    title: id,
    kind: 'note',
    body: target ? `[[${target.title}]]` : '',
    sensitivity: 'public_org',
    visibleTo: [],
    outlinks: target ? [{
      display: target.title,
      targetId: target.id,
      targetSlug: target.slug,
      access: 'accessible',
    }] : [],
    version: 1,
    updatedAt: '',
    updatedBy: '',
    versions: [],
  }
}

describe('graph selection scope', () => {
  it('incluye solo el primer salto desde las áreas seleccionadas', () => {
    const thirdHop = note('tercera', 'operations')
    const neighbor = note('vecina', 'develop', thirdHop)
    const selected = note('origen', 'product', neighbor)

    expect(selectionGraphNotes([selected, neighbor, thirdHop], ['product']).map((item) => item.id)).toEqual([
      'origen',
      'vecina',
    ])
  })

  it('oculta conexiones entre notas externas al núcleo seleccionado', () => {
    const selected = note('origen', 'product')
    const firstNeighbor = note('vecina', 'develop')
    const secondNeighbor = note('otra-vecina', 'operations')

    expect(includeSelectionConnection(['product'], selected, firstNeighbor)).toBe(true)
    expect(includeSelectionConnection(['product'], firstNeighbor, selected)).toBe(true)
    expect(includeSelectionConnection(['product'], firstNeighbor, secondNeighbor)).toBe(false)
  })
})
