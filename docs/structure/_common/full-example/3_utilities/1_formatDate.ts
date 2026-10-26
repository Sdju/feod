export function formatDate(
  date: Date | string,
  format: 'short' | 'long' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: format === 'short' ? 'short' : 'long'
  }
  return new Intl.DateTimeFormat('ru-RU', options).format(dateObj)
}
