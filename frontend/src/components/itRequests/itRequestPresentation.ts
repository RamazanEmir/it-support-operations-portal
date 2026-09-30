import { ApiError } from '../../api/client'

export const requestStatusTones = { pending: 'blue', in_progress: 'amber', completed: 'emerald', rejected: 'red' } as const

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatRequestDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

export function getITRequestErrorMessage(error: unknown, action: 'load' | 'create' | 'update' | 'delete'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      if (action === 'create') return 'The selected requester no longer exists. Please refresh the users list.'
      if (action === 'update') return 'The IT request or its requester no longer exists. Please check the request and refresh users.'
      return 'IT Request not found.'
    }
    if (error.status === 409) return action === 'delete'
      ? 'This IT request cannot be deleted because it is referenced by existing work logs.'
      : 'The request conflicts with existing data. Please refresh and try again.'
    if (error.status === 422) return 'Please check the form information and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
