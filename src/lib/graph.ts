import type { Note } from '../types'
import { extractNoteLinks } from './wiki'

export function selectionGraphNotes(notes: Note[], selectedAreaKeys: string[]) {
  const available = notes.filter((note) => !note.archived)
  const selected = available.filter((note) => selectedAreaKeys.includes(note.area))
  const selectedIds = new Set(selected.map((note) => note.id))
  const connectedIds = new Set(selectedIds)

  selected.forEach((note) => {
    extractNoteLinks(note, available).forEach((link) => {
      if (link.target) connectedIds.add(link.target.id)
    })
  })
  available.forEach((note) => {
    if (extractNoteLinks(note, available).some((link) => link.target && selectedIds.has(link.target.id))) {
      connectedIds.add(note.id)
    }
  })

  return available.filter((note) => connectedIds.has(note.id))
}

export function includeSelectionConnection(selectedAreaKeys: string[], source: Note, target?: Note) {
  return selectedAreaKeys.includes(source.area) || Boolean(target && selectedAreaKeys.includes(target.area))
}
