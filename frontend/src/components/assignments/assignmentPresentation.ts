import { ApiError } from '../../api/client'
import type { Asset } from '../../api/assets'
import type { User } from '../../api/users'

export function assignmentState(returnedAt: string | null) {
  return returnedAt === null ? { label: 'Active', tone: 'blue' as const } : { label: 'Returned', tone: 'slate' as const }
}

export function assignmentAssetLabel(id: number, assets: Asset[]): string {
  const asset = assets.find((item) => item.id === id)
  return asset ? `${asset.asset_tag} — ${asset.name}` : `Asset unavailable (#${id})`
}

export function assignmentEmployeeLabel(id: number, users: User[]): string {
  return users.find((user) => user.id === id)?.name ?? `User unavailable (#${id})`
}

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatAssignmentDate(value: string | null): string {
  if (value === null) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

export function getAssignmentErrorMessage(error: unknown, action: 'load' | 'create' | 'return'): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to perform this action.'
    if (error.status === 404) return action === 'create'
      ? 'The selected asset or employee is no longer available. Please refresh the options.'
      : 'Assignment not found.'
    if (error.status === 409) return action === 'create'
      ? 'The selected asset is no longer available for assignment. Please select an available asset.'
      : 'This assignment may already have been returned or its state has changed. The latest server data is being refreshed.'
    if (error.status === 422) return 'Please check the form information and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
