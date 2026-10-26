import type { ScannedNode } from './types'
import { escapeAttr } from './utils'

function renderNode(node: ScannedNode, depth = 0): string {
  const attrs: string[] = [
    `name="${escapeAttr(node.name)}"`,
    `type="${node.type}"`,
  ]

  if (node.meta.bold) attrs.push('bold')
  if (node.meta.comment) attrs.push(`comment="${escapeAttr(node.meta.comment)}"`)

  if (node.type === 'file' || node.children.length === 0) {
    return `${'  '.repeat(depth)}<FileTreeNode ${attrs.join(' ')} />`
  }

  const children = node.children.map((child) => renderNode(child, depth + 1)).join('\n')
  return `${'  '.repeat(depth)}<FileTreeNode ${attrs.join(' ')}>\n${children}\n${'  '.repeat(depth)}</FileTreeNode>`
}

export function renderFileTree(nodes: ScannedNode[]): string {
  const body = nodes.map((node) => renderNode(node)).join('\n')
  return `<FileTree>\n${body}\n</FileTree>`
}
