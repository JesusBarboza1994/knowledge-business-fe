import { describe, expect, it } from 'vitest'
import {
  extractWikiLinks,
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
