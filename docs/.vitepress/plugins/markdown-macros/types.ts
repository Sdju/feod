export interface AnnotationMeta {
  line: number
  content: string
  marker?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  color?: string
}

export interface EntryMeta {
  comment?: string
  bold?: boolean
  selectable?: boolean
  hidden?: boolean
  treeOnly?: boolean
  language?: string
  annotations?: AnnotationMeta[]
}

export interface DirMeta {
  root?: {
    name?: string
    bold?: boolean
    comment?: string
  }
  /** Скрыть файлы/папки по glob-подобным паттернам */
  ignore?: string[]
}

export interface ScannedFile {
  relativePath: string
  name: string
  absolutePath: string
  content: string
  language: string
  meta: EntryMeta
}

export interface ScannedNode {
  name: string
  type: 'file' | 'folder'
  path: string
  order: number | null
  children: ScannedNode[]
  file?: ScannedFile
  meta: EntryMeta
}
