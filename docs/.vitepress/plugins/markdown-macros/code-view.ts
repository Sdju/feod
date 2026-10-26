import type { ScannedFile, ScannedNode } from './types'
import { escapeAttr, formatAnnotations, toFenceLanguage } from './utils'

function collectFiles(nodes: ScannedNode[]): ScannedFile[] {
  const files: ScannedFile[] = []

  for (const node of nodes) {
    if (node.type === 'file' && node.file && !node.meta.treeOnly) {
      files.push(node.file)
      continue
    }
    files.push(...collectFiles(node.children))
  }

  return files
}

function renderTreeNode(node: ScannedNode, depth = 0): string {
  const attrs: string[] = [
    `name="${escapeAttr(node.name)}"`,
    `type="${node.type}"`,
  ]

  if (node.meta.bold) attrs.push('bold')
  if (node.meta.comment) attrs.push(`comment="${escapeAttr(node.meta.comment)}"`)

  if (node.type === 'file') {
    if (!node.meta.treeOnly) {
      attrs.push('selectable')
      attrs.push(`fileId="${escapeAttr(node.file?.name ?? node.name)}"`)
    }
    return `${'  '.repeat(depth)}<FileTreeNode ${attrs.join(' ')} />`
  }

  if (node.children.length === 0) {
    return `${'  '.repeat(depth)}<FileTreeNode ${attrs.join(' ')} />`
  }

  const children = node.children.map((child) => renderTreeNode(child, depth + 1)).join('\n')
  return `${'  '.repeat(depth)}<FileTreeNode ${attrs.join(' ')}>\n${children}\n${'  '.repeat(depth)}</FileTreeNode>`
}

function renderCodeViewFile(file: ScannedFile): string {
  const fenceLanguage = toFenceLanguage(file.language)
  const attrs = [
    `name="${escapeAttr(file.name)}"`,
    `language="${escapeAttr(file.language)}"`,
    formatAnnotations(file.meta.annotations),
  ]

  return `<CodeViewFile 
    ${attrs.join('\n    ')}
  >

\`\`\`${fenceLanguage}
${file.content}
\`\`\`

  </CodeViewFile>`
}

export function renderCodeView(nodes: ScannedNode[]): string {
  const sidebar = nodes.map((node) => renderTreeNode(node, 2)).join('\n')
  const files = collectFiles(nodes)
  const fileBlocks = files.map((file) => renderCodeViewFile(file)).join('\n  ')

  return `<CodeView>
  <template #sidebar>
    <FileTree>
${sidebar}
    </FileTree>
  </template>
  ${fileBlocks}
</CodeView>`
}
