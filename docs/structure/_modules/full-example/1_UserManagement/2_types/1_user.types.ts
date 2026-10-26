export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface CreateUserDto {
  name: string
  email: string
  role: 'admin' | 'user'
}
