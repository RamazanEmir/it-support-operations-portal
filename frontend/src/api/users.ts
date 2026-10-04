import { ApiError, request } from './client'

export type UserRole = 'admin' | 'technician' | 'employee'

export type User = {
  id: number
  name: string
  email: string
  role: UserRole
}

export type UserCreateInput = Omit<User, 'id'> & { password: string }
export type UserUpdateInput = Omit<User, 'id'> & { password?: string }

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  technician: 'Technician',
  employee: 'Employee',
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getUsers(): Promise<User[]> {
  return requireData(await request<User[]>('/users'))
}

export async function getUser(id: number): Promise<User> {
  return requireData(await request<User>(`/users/${id}`))
}

export async function createUser(data: UserCreateInput): Promise<User> {
  return requireData(await request<User>('/users', { method: 'POST', body: data }))
}

export async function updateUser(id: number, data: UserUpdateInput): Promise<User> {
  return requireData(await request<User>(`/users/${id}`, { method: 'PUT', body: data }))
}

export async function deleteUser(id: number): Promise<void> {
  await request<void>(`/users/${id}`, { method: 'DELETE' })
}

export function getUserErrorMessage(error: unknown, action: 'load' | 'save' | 'delete'): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to perform this action.'
    if (error.status === 404) return 'User not found.'
    if (error.status === 409) {
      return action === 'delete'
        ? 'This user cannot be deleted because it is referenced by existing records.'
        : 'This email address is already used by another user.'
    }
    if (error.status === 422) return 'Please check the form information and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
