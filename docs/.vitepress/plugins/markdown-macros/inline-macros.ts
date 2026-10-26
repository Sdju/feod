import type { AnnotationMeta, EntryMeta } from './types'

const FILE_COMMENT_RE = /^\s*(?:\/\/|<!--)\s*\[comment:(?:"([^"]*)"|'([^']*)')\]\s*(?:-->)?\s*$/
const BOLD_RE = /^\s*(?:\/\/|<!--)\s*\[bold\]\s*(?:-->)?\s*$/
const FOLDER_BOLD_RE = BOLD_RE
const TREE_ONLY_RE = /^\s*(?:\/\/|<!--)\s*\[tree-only\]\s*(?:-->)?\s*$/
const ANNOTATION_LINE_RE = /^\s*(?:\/\/|<!--)\s*@\[([a-z]+)(?::([a-z]+))?\]\s*(.+?)\s*(?:-->)?\s*$/i
const ANNOTATION_TRAILING_RE = /\s*(?:\/\/|<!--)\s*@\[([a-z]+)(?::([a-z]+))?\]\s*(.+?)\s*(?:-->)?\s*$/i

function createAnnotation(
  marker: string,
  content: string,
  position?: string,
): AnnotationMeta {
  const annotation: AnnotationMeta = {
    line: 0,
    content: content.trim(),
    marker: marker.toLowerCase(),
  }

  if (position && ['top', 'bottom', 'left', 'right'].includes(position)) {
    annotation.position = position as AnnotationMeta['position']
  }

  return annotation
}

export function parseFeodMarker(raw: string): EntryMeta {
  const meta: EntryMeta = {}

  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    const commentMatch = line.match(FILE_COMMENT_RE)
    if (commentMatch) {
      meta.comment = commentMatch[1] ?? commentMatch[2]
      continue
    }

    if (FOLDER_BOLD_RE.test(line)) {
      meta.bold = true
    }
  }

  return meta
}

export function parseInlineMacros(raw: string): { content: string; meta: EntryMeta } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const meta: EntryMeta = {}
  const annotations: AnnotationMeta[] = []
  const outputLines: string[] = []

  let pendingAnnotation: AnnotationMeta | null = null

  for (const line of lines) {
    const fileCommentMatch = line.match(FILE_COMMENT_RE)
    if (fileCommentMatch) {
      if (!meta.comment) {
        meta.comment = fileCommentMatch[1] ?? fileCommentMatch[2]
      }
      continue
    }

    if (TREE_ONLY_RE.test(line)) {
      meta.treeOnly = true
      continue
    }

    if (BOLD_RE.test(line)) {
      meta.bold = true
      continue
    }

    const annotationLineMatch = line.match(ANNOTATION_LINE_RE)
    if (annotationLineMatch) {
      const [, marker, position, content] = annotationLineMatch
      pendingAnnotation = createAnnotation(marker, content, position)
      continue
    }

    let outputLine = line
    const trailingMatch = outputLine.match(ANNOTATION_TRAILING_RE)

    if (trailingMatch) {
      const [, marker, position, content] = trailingMatch
      outputLine = outputLine.slice(0, trailingMatch.index).trimEnd()
      annotations.push({
        ...createAnnotation(marker, content, position),
        line: outputLines.length + 1,
      })
    }

    if (outputLine.length > 0 || outputLines.length > 0) {
      outputLines.push(outputLine)
    }

    if (pendingAnnotation) {
      annotations.push({
        ...pendingAnnotation,
        line: outputLines.length,
      })
      pendingAnnotation = null
    }
  }

  if (annotations.length > 0) {
    meta.annotations = annotations
  }

  return {
    content: outputLines.join('\n').trimEnd(),
    meta,
  }
}
