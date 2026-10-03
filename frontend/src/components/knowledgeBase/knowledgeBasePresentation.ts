import { ApiError } from '../../api/client'

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatArticleDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

export function getKnowledgeBaseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Article not found.'
    if (error.status === 422) return 'Please check the article information and try again.'
    if (error.status === 409) return 'The request conflicts with the current data. Please refresh and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
