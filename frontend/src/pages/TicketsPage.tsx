import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { formatTicketDate, getTicketErrorMessage, getTickets, ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from '../api/tickets'
import type { TicketCategory, TicketPriority, TicketStatus } from '../api/tickets'
import { getUsers } from '../api/users'
import { priorityTones, statusTones } from '../components/tickets/ticketPresentation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import FormField from '../components/ui/FormField'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Table from '../components/ui/Table'

function TicketsPage() {
  const navigate = useNavigate()
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: getTickets })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const [category, setCategory] = useState<TicketCategory | ''>('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const requesterNames = new Map((users.isError ? [] : users.data ?? []).map((user) => [user.id, user.name]))
  const filteredTickets = (tickets.data ?? []).filter((ticket) =>
    (!category || ticket.category === category) &&
    (!priority || ticket.priority === priority) &&
    (!status || ticket.status === status),
  )

  return (
    <>
      <PageHeader title="Tickets" description={tickets.data ? `${filteredTickets.length} support tickets` : undefined}
        action={<Button onClick={() => navigate('/tickets/new')}><Icon name="plus" className="size-4" />Create Ticket</Button>} />
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <FormField label="Category" htmlFor="ticket-category-filter">
            <Select id="ticket-category-filter" value={category} onChange={(event) => setCategory(event.target.value as TicketCategory | '')}>
              <option value="">All</option>
              {Object.entries(ticketCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="ticket-priority-filter">
            <Select id="ticket-priority-filter" value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority | '')}>
              <option value="">All</option>
              {Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="ticket-status-filter">
            <Select id="ticket-status-filter" value={status} onChange={(event) => setStatus(event.target.value as TicketStatus | '')}>
              <option value="">All</option>
              {Object.entries(ticketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
        </div>
      </Card>
      {users.isError && <p role="status" className="mb-4 text-sm text-slate-500">Requester names are unavailable. User IDs are shown instead.</p>}
      <Card className="overflow-hidden">
        {tickets.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading tickets...</p>
        ) : tickets.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getTicketErrorMessage(tickets.error, 'load')}</p>
            <Button variant="secondary" disabled={tickets.isFetching} onClick={() => void tickets.refetch()}>Retry</Button>
          </div>
        ) : tickets.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No tickets yet. Create a ticket to get started.</p>
        ) : filteredTickets.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No tickets match these filters.</p>
        ) : (
          <Table label="Tickets" headers={['Ticket / Title', 'Requester', 'Category', 'Priority', 'Status', 'Created', 'Actions']}>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50">
                <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800">
                  <div className="mb-1 font-semibold text-blue-700">#{ticket.id}</div>{ticket.title}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{requesterNames.get(ticket.employee_id) ?? `User unavailable (#${ticket.employee_id})`}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{ticketCategoryLabels[ticket.category]}</td>
                <td className="px-5 py-4"><Badge tone={priorityTones[ticket.priority]}>{ticketPriorityLabels[ticket.priority]}</Badge></td>
                <td className="px-5 py-4"><Badge tone={statusTones[ticket.status]}>{ticketStatusLabels[ticket.status]}</Badge></td>
                <td className="px-5 py-4 text-sm text-slate-500">{formatTicketDate(ticket.created_at)}</td>
                <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View ticket ${ticket.id}`} onClick={() => navigate(`/tickets/${ticket.id}`)}>View</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

export default TicketsPage
