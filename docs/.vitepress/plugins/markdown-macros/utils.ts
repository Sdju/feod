import fs from 'node:fs'
import path from 'node:path'
import type { DirMeta, EntryMeta } from './types'

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  vue: 'vue',
  css: 'css',
  scss: 'css',
  html: 'html',
  json: 'json',
  md: 'markdown',
}

const ORDER_PREFIX_RE = /^(\d+)_/

export interface ParsedEntryName {
  order: number | null
  displayName: string
}

export function parseOrderName(name: string): ParsedEntryName {
  const match = name.match(ORDER_PREFIX_RE)
  if (!match) {
    return { order: null, displayName: name }
  }

  return {
    order: Number.parseInt(match[1], 10),
    displayName: name.slice(match[0].length),
  }
}

export function toDisplayPath(relativePath: string): string {
  return relativePath
    .split('/')
    .map((segment) => parseOrderName(segment).displayName)
    .join('/')
}

export function compareEntryNames(aName: string, bName: string): number {
  const a = parseOrderName(aName)
  const b = parseOrderName(bName)

  if (a.order !== null && b.order !== null) {
    if (a.order !== b.order) return a.order - b.order
    return a.displayName.localeCompare(b.displayName)
  }

  if (a.order !== null) return -1
  if (b.order !== null) return 1

  return aName.localeCompare(bName)
}

export function detectLanguage(fileName: string): string {
  const { displayName } = parseOrderName(fileName)
  const ext = displayName.split('.').pop()?.toLowerCase() ?? ''
  return LANGUAGE_MAP[ext] ?? ext
}

const FENCE_LANGUAGE_MAP: Record<string, string> = {
  typescript: 'ts',
  javascript: 'js',
  markdown: 'md',
}

export function toFenceLanguage(language: string): string {
  return FENCE_LANGUAGE_MAP[language] ?? language
}

export function readMeta(dir: string): DirMeta {
  const metaPath = path.join(dir, '_meta.json')
  if (!fs.existsSync(metaPath)) return {}

  return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as DirMeta
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

export function formatAnnotations(annotations: EntryMeta['annotations']): string {
  if (!annotations?.length) return ':annotations="[]"'

  const lines = annotations.map((item) => {
    const parts = [
      `line: ${item.line}`,
      `content: '${item.content.replace(/'/g, "\\'")}'`,
    ]

    if (item.marker) parts.push(`marker: '${item.marker}'`)
    if (item.position) parts.push(`position: '${item.position}'`)
    if (item.color) parts.push(`color: '${item.color}'`)

    return `      {\n        ${parts.join(',\n        ')}\n      }`
  })

  return `:annotations="[\n${lines.join(',\n')}\n    ]"`
}

export function shouldIgnore(name: string, ignore: string[] = []): boolean {
  if (name === '.feod') return true
  if (name.startsWith('_meta.')) return true
  if (name.endsWith('.meta.yaml') || name.endsWith('.meta.yml') || name.endsWith('.meta.json')) {
    return true
  }

  return ignore.some((pattern) => {
    if (pattern.startsWith('*.')) {
      return name.endsWith(pattern.slice(1))
    }
    return name === pattern
  })
}
