import type { Note, WikiLink } from '../types'

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function extractWikiLinks(body: string, notes: Note[]): WikiLink[] {
  const matches = [...body.matchAll(/\[\[([^\]]+)\]\]/g)]
  const bySlug = new Map(notes.filter((note) => !note.archived).map((note) => [note.slug, note]))
  return matches.map((match) => {
    const [title, anchor] = match[1].split('#')
    return { raw: match[0], title, anchor, target: bySlug.get(slugify(title)) }
  })
}

export function uniqueLinks(links: WikiLink[]) {
  return links.filter((link, index) => links.findIndex((item) => item.title === link.title) === index)
}

export function wikiLinkCompletion(title: string, followingText: string) {
  const existingClosers = followingText.match(/^\]{0,2}/)?.[0].length ?? 0
  return `${title}${']'.repeat(2 - existingClosers)}`
}

export function markdownWithWikiLinks(body: string) {
  return body.replace(/\[\[([^\]#]+)(?:#([^\]]+))?\]\]/g, (_, title: string, anchor?: string) => {
    const label = anchor ? `${title} › ${anchor}` : title
    return `[${label}](#kb/${slugify(title)})`
  })
}

export function noteReferenceFromHref(href?: string) {
  if (!href) return undefined
  if (href.startsWith('#kb/')) return slugify(decodeURIComponent(href.slice(4)))
  if (href.startsWith('kb://')) return slugify(decodeURIComponent(href.slice(5)))
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return undefined

  const path = decodeURIComponent(href.split(/[?#]/, 1)[0]).replace(/\\/g, '/')
  if (!path.toLowerCase().endsWith('.md')) return undefined
  const filename = path.split('/').pop()?.replace(/\.md$/i, '')
  return filename ? slugify(filename) : undefined
}

export function resolveInternalNoteHref(href: string | undefined, notes: Note[]) {
  const reference = noteReferenceFromHref(href)
  if (!reference) return undefined
  return notes.find((note) => !note.archived && note.slug === reference)
}

export function unlinkNoteReferences(body: string, note: Pick<Note, 'slug' | 'title'>) {
  const references = new Set([note.slug, slugify(note.title)])
  let removedLinks = 0
  const nextBody = body.replace(/\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const [name] = inner.split('#')
    if (!references.has(slugify(name))) return full
    removedLinks += 1
    return name.trim()
  })
  return { body: nextBody, removedLinks }
}
