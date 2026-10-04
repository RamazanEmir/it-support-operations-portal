import { ApiError, request } from './client'

export type TicketCategory = 'microsoft_365' | 'hardware' | 'network' | 'software' | 'printer' | 'other'
export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type TicketCreateInput = {
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  employee_id?: number
}

export type TicketUpdateInput = TicketCreateInput & {
  employee_id: number
  status: TicketStatus
  resolution: string | null
}

export type Ticket = TicketUpdateInput & {
  id: number
  created_at: string
  updated_at: string
}

export const ticketCategoryLabels: Record<TicketCategory, string> = {
  microsoft_365: 'Microsoft 365', hardware: 'Hardware', network: 'Network',
  software: 'Software', printer: 'Printer', other: 'Other',
}
export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: 'Low', medium: 'Medium', high: 'High',
}
export const ticketStatusLabels: Record<TicketStatus, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getTickets(): Promise<Ticket[]> {
  return requireData(await request<Ticket[]>('/tickets'))
}

export async function getTicket(id: number): Promise<Ticket> {
  return requireData(await request<Ticket>(`/tickets/${id}`))
}

export async function createTicket(data: TicketCreateInput): Promise<Ticket> {
  return requireData(await request<Ticket>('/tickets', { method: 'POST', body: data }))
}

export async function updateTicket(id: number, data: TicketUpdateInput): Promise<Ticket> {
  return requireData(await request<Ticket>(`/tickets/${id}`, { method: 'PUT', body: data }))
}

export function getTicketErrorMessage(error: unknown, action: 'load' | 'create' | 'update'): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'You do not have permission to perform this action.'
    if (error.status === 404) {
      if (action === 'create') return 'The selected requester no longer exists. Please refresh the users list.'
      if (action === 'update') return 'The ticket or its requester no longer exists. Please refresh the ticket.'
      return 'Ticket not found.'
    }
    if (error.status === 422) return 'Please check the form information and try again.'
    if (error.status === 409) return 'The request conflicts with existing data. Please refresh and try again.'
  }
  return 'The request could not be completed. Please try again.'
}

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function formatTicketDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}
