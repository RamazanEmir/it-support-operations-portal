import { ApiError } from '../../api/client'
import type { User } from '../../api/users'
import type { Ticket } from '../../api/tickets'
import type { ITRequest } from '../../api/itRequests'
import type { WorkLog } from '../../api/workLogs'

export function formatWorkDate(value: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : 'Date unavailable'
}

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })
export function formatCreatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}
export function formatDuration(value: number): string { return `${value} min` }

export function technicianLabel(id: number, users: User[]): string {
  return users.find((user) => user.id === id)?.name ?? `User unavailable (#${id})`
}

export function workLogRelationLabel(log: Pick<WorkLog, 'ticket_id' | 'it_request_id'>, tickets: Ticket[], requests: ITRequest[]): string {
  if (log.ticket_id !== null) {
    const ticket = tickets.find((item) => item.id === log.ticket_id)
    return ticket ? `Ticket #${ticket.id} — ${ticket.title}` : `Ticket unavailable (#${log.ticket_id})`
  }
  if (log.it_request_id !== null) {
    const request = requests.find((item) => item.id === log.it_request_id)
    return request ? `IT Request #${request.id} — ${request.title}` : `IT Request unavailable (#${log.it_request_id})`
  }
  return 'General'
}

export function getWorkLogErrorMessage(error: unknown, action: 'load' | 'save' | 'delete'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return action === 'save'
      ? 'The work log, technician or related record is no longer available. Please check the record and refresh the options.'
      : 'Work Log not found.'
    if (error.status === 409 && action === 'save') return 'The selected user must be a technician. Please refresh users and select an available technician.'
    if (error.status === 422) return 'Please check the form information and try again.'
  }
  return 'The request could not be completed. Please try again.'
}
