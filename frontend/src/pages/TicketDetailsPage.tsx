import { useAuth } from '../auth/AuthContext'
import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { formatTicketDate, getTicket, getTicketErrorMessage, ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels, updateTicket } from '../api/tickets'
import type { Ticket, TicketPriority, TicketStatus, TicketUpdateInput } from '../api/tickets'
import { getUsers } from '../api/users'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'

function TicketDetailsPage() {
  const { currentUser } = useAuth()
  const isEmployee = currentUser?.role === 'employee'
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const queryClient = useQueryClient()
  const updating = useRef(false)
  const ticket = useQuery({
    queryKey: ['tickets', id], queryFn: () => getTicket(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: validId && !isEmployee })
  const update = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: TicketUpdateInput }) => updateTicket(ticketId, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['tickets', data.id], data)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tickets'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['tickets', data.id], exact: true }),
      ])
    },
    onSettled: () => { updating.current = false },
  })

  function updateSelection(changes: Partial<Pick<Ticket, 'priority' | 'status'>>) {
    if (isEmployee || !ticket.data || updating.current || ticket.isError) return
    const current = queryClient.getQueryData<Ticket>(['tickets', id]) ?? ticket.data
    const data: TicketUpdateInput = {
      title: current.title,
      description: current.description,
      category: current.category,
      priority: changes.priority ?? current.priority,
      status: changes.status ?? current.status,
      employee_id: current.employee_id,
      resolution: current.resolution,
    }
    updating.current = true
    update.mutate({ ticketId: id, data })
  }

  const notFound = !validId || (ticket.error instanceof ApiError && ticket.error.status === 404)
  const data = ticket.data
  const requester = isEmployee ? currentUser : users.isError ? undefined : users.data?.find((user) => user.id === data?.employee_id)

  return (
    <>
      <BackLink to="/tickets" />
      <PageHeader title={data && !notFound ? `#${data.id}` : 'Ticket Details'} description="Ticket details" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Ticket not found.</p></Card>
      ) : ticket.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading ticket...</p>
      ) : ticket.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getTicketErrorMessage(ticket.error, 'load')}</p>
          <Button variant="secondary" disabled={ticket.isFetching} onClick={() => void ticket.refetch()}>Retry</Button>
        </Card>
      ) : data && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)]">
          <Card className="min-w-0 p-6">
            <h2 className="break-words text-xl font-semibold text-slate-900">{data.title}</h2>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h3>
              <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.description}</p>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Resolution</h3>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.resolution ?? 'No resolution recorded.'}</p>
            </div>
          </Card>
          <Card className="min-w-0 overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">Details</h2></div>
            <div className="space-y-4 p-5">
              <DetailRow label="Category" value={ticketCategoryLabels[data.category]} />
              {isEmployee ? <><DetailRow label="Priority" value={ticketPriorityLabels[data.priority]} /><DetailRow label="Status" value={ticketStatusLabels[data.status]} /></> : <><div className="flex items-center justify-between gap-4">
                <label htmlFor="ticket-detail-priority" className="text-sm text-slate-500">Priority</label>
                <Select id="ticket-detail-priority" className="min-h-9 max-w-40 py-1.5" value={data.priority} disabled={update.isPending}
                  onChange={(event) => updateSelection({ priority: event.target.value as TicketPriority })}>
                  {Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="ticket-detail-status" className="text-sm text-slate-500">Status</label>
                <Select id="ticket-detail-status" className="min-h-9 max-w-40 py-1.5" value={data.status} disabled={update.isPending}
                  onChange={(event) => updateSelection({ status: event.target.value as TicketStatus })}>
                  {Object.entries(ticketStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div></>}
              <DetailRow label="Requester" value={requester?.name ?? `User unavailable (#${data.employee_id})`} />
              <DetailRow label="Created At" value={formatTicketDate(data.created_at)} />
              <DetailRow label="Updated At" value={formatTicketDate(data.updated_at)} />
              {update.isPending && <p role="status" className="text-sm text-slate-500">Saving changes...</p>}
              {update.isError && (
                <div className="space-y-2">
                  <p role="alert" className="text-sm text-red-700">{getTicketErrorMessage(update.error, 'update')}</p>
                  <Button variant="secondary" disabled={ticket.isFetching} onClick={() => void ticket.refetch()}>Refresh ticket</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

export default TicketDetailsPage
