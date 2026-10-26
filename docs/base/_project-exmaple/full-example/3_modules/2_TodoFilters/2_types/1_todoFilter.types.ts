export type TodoFilter = 'all' | 'active' | 'completed'

export interface TodoFilterCounts {
  all: number
  active: number
  completed: number
}
