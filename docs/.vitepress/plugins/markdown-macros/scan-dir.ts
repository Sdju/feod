import fs from 'node:fs'
import path from 'node:path'
import { parseFeodMarker, parseInlineMacros } from './inline-macros'
import type { DirMeta, EntryMeta, ScannedFile, ScannedNode } from './types'
import { compareEntryNames, detectLanguage, parseOrderName, readMeta, shouldIgnore, toDisplayPath } from './utils'

function readFolderMeta(dir: string): EntryMeta {
  const markerPath = path.join(dir, '.feod')
  if (!fs.existsSync(markerPath)) return {}

  return parseFeodMarker(fs.readFileSync(markerPath, 'utf-8'))
}

function readSourceFile(filePath: string): { content: string; meta: EntryMeta } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return parseInlineMacros(raw)
}

function scanDirectory(dir: string, meta: DirMeta, relativeDir = ''): ScannedNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !shouldIgnore(entry.name, meta.ignore))
    .sort((a, b) => {
      const aOrder = parseOrderName(a.name).order
      const bOrder = parseOrderName(b.name).order

      if (aOrder !== null || bOrder !== null) {
        return compareEntryNames(a.name, b.name)
      }

      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  return entries.map((entry) => {
    const entryPath = path.join(dir, entry.name)
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
    const { order, displayName } = parseOrderName(entry.name)

    if (entry.isDirectory()) {
      const folderMeta = readFolderMeta(entryPath)
      const children = scanDirectory(entryPath, meta, relativePath).filter(Boolean) as ScannedNode[]

      return {
        name: displayName,
        type: 'folder',
        path: relativePath,
        order,
        children,
        meta: folderMeta,
      } satisfies ScannedNode
    }

    const { content, meta: fileMeta } = readSourceFile(entryPath)
    const fileDisplayPath = toDisplayPath(relativePath)
    const file: ScannedFile = {
      relativePath,
      name: fileDisplayPath,
      absolutePath: entryPath,
      content,
      language: fileMeta.language ?? detectLanguage(entry.name),
      meta: fileMeta,
    }

    return {
      name: displayName,
      type: 'file',
      path: relativePath,
      order,
      children: [],
      file,
      meta: fileMeta,
    } satisfies ScannedNode
  }).filter((node): node is ScannedNode => node !== null)
}

export function collectSourceFiles(dir: string, ignore: string[] = []): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []

  for (const markerName of ['_meta.json', '.feod']) {
    const markerPath = path.join(dir, markerName)
    if (fs.existsSync(markerPath)) {
      files.push(markerPath)
    }
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldIgnore(entry.name, ignore)) continue

    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath, ignore))
      continue
    }

    files.push(entryPath)
  }

  return files
}

export function scanSourceDir(dir: string): { meta: DirMeta; nodes: ScannedNode[] } {
  const meta = readMeta(dir)
  const nodes = scanDirectory(dir, meta)

  if (meta.root?.name) {
    return {
      meta,
      nodes: [{
        name: meta.root.name,
        type: 'folder',
        path: '',
        order: null,
        children: nodes,
        meta: {
          bold: meta.root.bold,
          comment: meta.root.comment,
        },
      }],
    }
  }

  return { meta, nodes }
}
