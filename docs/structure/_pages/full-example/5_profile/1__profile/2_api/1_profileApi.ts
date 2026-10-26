export interface Profile {
  id: string
  name: string
  email: string
}

export async function fetchProfile(): Promise<Profile> {
  const response = await fetch('/api/profile')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function updateProfile(name: string): Promise<Profile> {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
