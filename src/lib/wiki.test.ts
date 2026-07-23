import { describe, expect, it } from 'vitest'
import {
  extractWikiLinks,
  extractNoteLinks,
  markdownWithWikiLinks,
  noteReferenceFromHref,
  resolveInternalNoteHref,
  slugify,
  uniqueLinks,
  unlinkNoteReferences,
  wikiLinkCompletion,
} from './wiki'
import { initialNotes } from '../data/mockData'

describe('wiki helpers', () => {
  it('normaliza títulos con acentos', () => {
    expect(slugify('Autorización actual')).toBe('autorizacion-actual')
  })

  it('distingue enlaces resueltos y pendientes', () => {
    const links = extractWikiLinks('Ver [[Arquitectura actual]] y [[Nota futura]].', initialNotes)
    expect(links[0].target?.slug).toBe('arquitectura-actual')
    expect(links[1].target).toBeUndefined()
  })

  it('usa el target id autoritativo cuando el texto del enlace no coincide con el slug', () => {
    const target = initialNotes.find((note) => note.slug === 'arquitectura-actual')!
    const source = {
      ...initialNotes[0],
      body: 'Ver [[Arquitectura técnica]].',
      outlinks: [{
        display: 'Arquitectura técnica',
        targetId: target.id,
        targetSlug: target.slug,
        access: 'accessible' as const,
      }],
    }

    expect(extractNoteLinks(source, initialNotes).at(0)?.target?.id).toBe(target.id)
  })

  it('diferencia una conexión restringida de una referencia inexistente', () => {
    const source = {
      ...initialNotes[0],
      body: 'Ver 🔒 *[restricted]*.',
      outlinks: [{
        display: 'Plan confidencial',
        access: 'restricted' as const,
      }],
    }

    expect(extractNoteLinks(source, initialNotes).at(0)).toMatchObject({
      title: 'Plan confidencial',
      restricted: true,
      target: undefined,
    })
  })

  it('deduplica enlaces por título', () => {
    expect(uniqueLinks(extractWikiLinks('[[Knowledge Hub]] [[Knowledge Hub]]', initialNotes))).toHaveLength(1)
  })

  it('convierte wikilinks para el renderer Markdown', () => {
    expect(markdownWithWikiLinks('[[Modelo de datos#Entidades]]')).toBe('[Modelo de datos › Entidades](#kb/modelo-de-datos)')
  })

  it('reconoce referencias Markdown relativas como notas internas', () => {
    expect(noteReferenceFromHref('../Desarrollo/Arquitectura%20actual.md#componentes')).toBe('arquitectura-actual')
    expect(resolveInternalNoteHref('Arquitectura actual.md', initialNotes)?.slug).toBe('arquitectura-actual')
  })

  it('no convierte enlaces web en referencias internas', () => {
    expect(noteReferenceFromHref('https://example.com/Arquitectura-actual.md')).toBeUndefined()
  })

  it('completa wikilinks sin duplicar los corchetes automáticos', () => {
    expect(wikiLinkCompletion('mms-payments', ']]')).toBe('mms-payments')
    expect(wikiLinkCompletion('mms-payments', ']')).toBe('mms-payments]')
    expect(wikiLinkCompletion('mms-payments', '')).toBe('mms-payments]]')
  })

  it('rompe referencias convirtiéndolas en texto plano', () => {
    expect(unlinkNoteReferences(
      'Depende de [[Arquitectura actual]] y [[Modelo de datos]].',
      { slug: 'arquitectura-actual', title: 'Arquitectura actual' },
    )).toEqual({
      body: 'Depende de Arquitectura actual y [[Modelo de datos]].',
      removedLinks: 1,
    })
  })
})
