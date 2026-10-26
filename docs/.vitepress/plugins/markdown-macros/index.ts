import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { renderCodeView } from './code-view'
import { renderFileTree } from './file-tree'
import { collectSourceFiles, scanSourceDir } from './scan-dir'

const MACRO_RE = /<!--\s*@include(?:\s+([a-z-]+))?:\s*([^\s?]+)(?:\?([a-z-]+))?\s*-->/g

type MacroMode = 'code-view' | 'file-tree'

interface MacroExpandResult {
  content: string
  watchFiles: string[]
}

function resolveIncludePath(includePath: string, currentFile: string, srcDir: string): string {
  if (includePath.startsWith('@/')) {
    return path.join(srcDir, includePath.slice(2))
  }

  return path.resolve(path.dirname(currentFile), includePath)
}

function getMacroMode(explicitMode?: string, queryMode?: string): MacroMode | null {
  const mode = explicitMode ?? queryMode
  if (mode === 'code-view' || mode === 'file-tree') return mode
  return null
}

function expandMacro(
  mode: MacroMode,
  includePath: string,
  currentFile: string,
  srcDir: string,
): MacroExpandResult {
  const resolvedPath = resolveIncludePath(includePath, currentFile, srcDir)

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[feod-markdown-macros] Path not found: ${includePath} (resolved: ${resolvedPath})`)
    return {
      content: `<!-- @include ${mode}: ${includePath} (not found) -->`,
      watchFiles: [],
    }
  }

  const stat = fs.statSync(resolvedPath)

  if (!stat.isDirectory()) {
    if (mode === 'file-tree') {
      console.warn(`[feod-markdown-macros] file-tree expects a directory: ${includePath}`)
      return {
        content: `<!-- @include file-tree: ${includePath} (not a directory) -->`,
        watchFiles: [],
      }
    }

    return {
      content: fs.readFileSync(resolvedPath, 'utf-8'),
      watchFiles: [resolvedPath],
    }
  }

  const { nodes } = scanSourceDir(resolvedPath)

  return {
    content: mode === 'code-view' ? renderCodeView(nodes) : renderFileTree(nodes),
    watchFiles: collectSourceFiles(resolvedPath),
  }
}

function expandMacros(src: string, currentFile: string, srcDir: string): MacroExpandResult {
  const watchFiles = new Set<string>()

  const content = src.replace(MACRO_RE, (_match, explicitMode: string | undefined, includePath: string, queryMode: string | undefined) => {
    const mode = getMacroMode(explicitMode, queryMode)

    if (!mode) {
      return _match
    }

    const result = expandMacro(mode, includePath, currentFile, srcDir)
    for (const file of result.watchFiles) {
      watchFiles.add(file)
    }

    return result.content
  })

  return {
    content,
    watchFiles: [...watchFiles],
  }
}

export function feodMarkdownMacros(srcDir: string): Plugin {
  return {
    name: 'feod-markdown-macros',
    enforce: 'pre',
    transform: {
      handler(code, id) {
        if (!id.endsWith('.md')) return

        const { content, watchFiles } = expandMacros(code, id, srcDir)
        if (content === code) return

        for (const file of watchFiles) {
          this.addWatchFile(file)
        }

        return {
          code: content,
          map: null,
        }
      },
    },
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.feod') && !file.endsWith('_meta.json') && !/\.(ts|vue|js|tsx|jsx|css|html|json)$/.test(file)) {
        return
      }

      const modules = [...server.moduleGraph.idToModuleMap.values()].filter((mod) => {
        return mod.id?.endsWith('.md') && (mod.id.includes('/structure/') || mod.id.includes('/base/') || mod.id.includes('/linting/'))
      })

      if (modules.length === 0) return

      for (const mod of modules) {
        server.moduleGraph.invalidateModule(mod)
      }

      return modules
    },
  }
}
