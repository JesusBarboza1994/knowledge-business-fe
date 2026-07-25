import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownEditor } from './MarkdownEditor'
import type { Area, Note } from '../types'

vi.mock('../services/api', () => ({
  api: { assetUrl: (id: string) => `http://api.test/v1/knowledge/assets/${id}/raw` },
}))

const ASSET_ID = '6a64f94d70006eebcadf104e'

function note(body: string): Note {
  return {
    id: '1',
    area: 'develop',
    slug: 'nota',
    title: 'Nota',
    kind: 'note',
    body,
    sensitivity: 'internal_area',
    visibleTo: ['develop'],
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'alguien',
    versions: [],
  }
}

const areas: Area[] = [
  {
    key: 'develop',
    name: 'Develop',
    description: '',
    color: '#fff',
    access: 'write',
    noteCount: 1,
    defaultSensitivity: 'internal_area',
  },
]

function renderBody(body: string) {
  return render(
    <MarkdownEditor
      note={note(body)}
      notes={[note(body)]}
      areas={areas}
      canEdit={false}
      onSaved={vi.fn()}
      onOpenNote={vi.fn()}
    />,
  )
}

describe('MarkdownEditor image rendering', () => {
  /**
   * react-markdown's default sanitizer drops unknown protocols, which turned `kb:asset/<id>`
   * into an empty src with no error at all. Guards the regression, not just the helper.
   */
  it('resuelve kb:asset a la URL del endpoint autorizado', () => {
    renderBody(`# Nota\n\n![diagrama](kb:asset/${ASSET_ID})`)

    const image = screen.getByAltText('diagrama')
    expect(image).toHaveAttribute('src', `http://api.test/v1/knowledge/assets/${ASSET_ID}/raw`)
  })

  it('deja intactas las imágenes con URL normal', () => {
    renderBody('![externa](https://ejemplo.com/x.png)')

    expect(screen.getByAltText('externa')).toHaveAttribute('src', 'https://ejemplo.com/x.png')
  })

  /** The sanitizer blanks the URL; React 19 then drops the attribute rather than emitting src="". */
  it('sigue saneando los esquemas peligrosos', () => {
    renderBody('![xss](javascript:alert(1))')

    expect(screen.getByAltText('xss').getAttribute('src')).toBeFalsy()
  })
})
