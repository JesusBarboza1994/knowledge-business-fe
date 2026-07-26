import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MarkdownEditor } from './MarkdownEditor'
import type { Area, Note } from '../types'

const ASSET_ID = '6a64f94d70006eebcadf104e'

const uploadAsset = vi.fn()
const saveNote = vi.fn()

vi.mock('../services/api', () => ({
  api: {
    assetUrl: (id: string) => `http://api.test/v1/knowledge/assets/${id}/raw`,
    uploadAsset: (...args: unknown[]) => uploadAsset(...args),
    saveNote: (...args: unknown[]) => saveNote(...args),
    getNote: vi.fn(),
    getVersions: vi.fn().mockResolvedValue([]),
  },
}))

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

function renderBody(body: string, canEdit = false) {
  return render(
    <MarkdownEditor
      note={note(body)}
      notes={[note(body)]}
      areas={areas}
      canEdit={canEdit}
      onSaved={vi.fn()}
      onOpenNote={vi.fn()}
    />,
  )
}

/** jsdom has no real clipboard payloads, so the paste event carries the file list by hand. */
function pasteFile(target: Element, file: File) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: { files: [file], items: [], types: ['Files'], getData: () => '' },
  })
  target.dispatchEvent(event)
  return event
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

describe('MarkdownEditor image upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveNote.mockResolvedValue(note(''))
  })

  async function openEditor(body = '# Nota\n\n') {
    renderBody(body, true)
    // The mode switch is duplicated for desktop and mobile and Tailwind hides one of them, which
    // userEvent refuses to click. The click itself is not what is under test here.
    fireEvent.click(screen.getAllByTitle('Editar')[0])
    const content = await waitFor(() => {
      const node = document.querySelector('.cm-content')
      if (!node) throw new Error('CodeMirror did not mount')
      return node
    })
    return { content }
  }

  it('sube la imagen pegada y deja la referencia en el cuerpo', async () => {
    uploadAsset.mockResolvedValue({
      id: ASSET_ID,
      filename: 'captura.png',
      mime: 'image/png',
      size: 10,
      ref: `kb:asset/${ASSET_ID}`,
      markdown: `![captura.png](kb:asset/${ASSET_ID})`,
    })
    const { content } = await openEditor()

    pasteFile(content, new File(['bytes'], 'captura.png', { type: 'image/png' }))

    // The area and the note's visibility travel with the upload.
    await waitFor(() => expect(uploadAsset).toHaveBeenCalledWith(
      expect.any(File),
      'develop',
      { sensitivity: 'internal_area', visibleTo: ['develop'] },
    ))
    await waitFor(() =>
      expect(content.textContent).toContain(`![captura.png](kb:asset/${ASSET_ID})`),
    )
    expect(content.textContent).not.toContain('Subiendo')
  })

  it('muestra el marcador de progreso mientras la subida está en vuelo', async () => {
    let resolveUpload: (value: unknown) => void = () => {}
    uploadAsset.mockReturnValue(new Promise((resolve) => { resolveUpload = resolve }))
    const { content } = await openEditor()

    pasteFile(content, new File(['bytes'], 'captura.png', { type: 'image/png' }))

    await waitFor(() => expect(content.textContent).toContain('Subiendo captura.png…'))
    // Autosave must not persist the placeholder.
    expect(saveNote).not.toHaveBeenCalled()

    resolveUpload({ markdown: `![captura.png](kb:asset/${ASSET_ID})` })
    await waitFor(() => expect(content.textContent).not.toContain('Subiendo'))
  })

  it('retira el marcador y avisa cuando la subida falla', async () => {
    uploadAsset.mockRejectedValue(new Error('El archivo supera el límite'))
    const { content } = await openEditor()

    pasteFile(content, new File(['bytes'], 'grande.png', { type: 'image/png' }))

    await waitFor(() => expect(screen.getByText('El archivo supera el límite')).toBeInTheDocument())
    expect(content.textContent).not.toContain('Subiendo')
  })

  /** CodeMirror handles plain pastes itself, so only the absence of an upload is ours to assert. */
  it('ignora el pegado que no trae imágenes', async () => {
    const { content } = await openEditor()

    pasteFile(content, new File(['x'], 'notas.txt', { type: 'text/plain' }))

    expect(uploadAsset).not.toHaveBeenCalled()
    expect(content.textContent).not.toContain('Subiendo')
  })
})
