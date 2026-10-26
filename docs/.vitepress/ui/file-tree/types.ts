export interface FileTreeNodeConfig {
  /** Имя файла или папки */
  name: string
  /** Тип: файл, папка или оба (📄, 📁, 📄/📁) */
  type: 'file' | 'folder' | 'both'
  /** Дочерние узлы (для папок) */
  children?: FileTreeNodeConfig[]
  /** Ссылка на страницу/файл */
  link?: string
  /** Комментарий в скобках */
  comment?: string
  /** Вариативная часть (обозначается обратными кавычками) */
  variant?: boolean
  /** Фрактальная сущность (обозначается *) */
  fractal?: boolean
  /** Комментарий для фрактальной сущности */
  fractalComment?: string
  /** Наличие 1 или более сущностей (обозначается +) */
  multiple?: boolean
  /** Опциональное наличие (обозначается ?) */
  optional?: boolean
  /** Запрещено создавать (зачеркнутый текст) */
  forbidden?: boolean
  /** Жирный текст */
  bold?: boolean
}
