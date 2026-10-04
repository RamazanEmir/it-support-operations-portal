import { ApiError } from '../../api/client'

export const assetStatusTones = { available: 'emerald', assigned: 'blue', maintenance: 'amber', retired: 'slate' } as const

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatAssetDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

export function getAssetErrorMessage(error: unknown, action: 'load' | 'create' | 'update' | 'delete'): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to perform this action.'
    if (error.status === 404) return 'Asset not found.'
    if (error.status === 409) {
      if (action === 'delete') return 'This asset cannot be deleted because assignment history exists.'
      if (action === 'create') return 'An asset with the same tag or serial number already exists.'
      return 'The update conflicts with existing asset data or its assignment status. Check the tag and serial number, and refresh the asset before retrying.'
    }
    if (error.status === 422) return 'Please check the form information and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
