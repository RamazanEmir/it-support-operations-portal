import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getDashboardSummary } from '../api/dashboard'
import { getTicketErrorMessage, getTickets, ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from '../api/tickets'
import { getUsers } from '../api/users'
import { priorityTones, statusTones } from '../components/tickets/ticketPresentation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function DashboardPage() {
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary })
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: getTickets })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const requesterNames = new Map((users.isError ? [] : users.data ?? []).map((user) => [user.id, user.name]))
  const recentTickets = [...tickets.data ?? []]
    .sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at) || second.id - first.id)
    .slice(0, 5)
  const stats = summary.data ? [
    { label: 'Total Tickets', value: summary.data.tickets.total },
    { label: 'Open Tickets', value: summary.data.tickets.open },
    { label: 'In Progress Tickets', value: summary.data.tickets.in_progress },
    { label: 'Resolved Tickets', value: summary.data.tickets.resolved },
  ] : []

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of the current support workload." />
      <Card className="overflow-hidden">
        {summary.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading summary...</p>
        ) : summary.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">The dashboard summary could not be loaded. Please try again.</p>
            <Button variant="secondary" disabled={summary.isFetching} onClick={() => void summary.refetch()}>Retry</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`px-5 py-5 ${index > 0 ? 'border-t border-slate-200' : ''} ${index === 1 ? 'sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'xl:border-l xl:border-t-0' : ''} ${index === 3 ? 'sm:border-l xl:border-t-0' : ''}`}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Tickets</h2>
          <p className="mt-0.5 text-xs text-slate-500">Most recently created support requests</p>
        </div>
        {tickets.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading tickets...</p>
        ) : tickets.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getTicketErrorMessage(tickets.error, 'load')}</p>
            <Button variant="secondary" disabled={tickets.isFetching} onClick={() => void tickets.refetch()}>Retry</Button>
          </div>
        ) : recentTickets.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No tickets yet.</p>
        ) : (
          <>
            {users.isError && <p role="status" className="px-5 py-3 text-sm text-slate-500">Requester names are unavailable. User IDs are shown instead.</p>}
            <Table label="Recent Tickets" headers={['ID', 'Title', 'Category', 'Priority', 'Status', 'Requester']}>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-semibold text-blue-700">
                    <Link to={`/tickets/${ticket.id}`} aria-label={`View ticket ${ticket.id}`} className="rounded-sm hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500">#{ticket.id}</Link>
                  </td>
                  <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800">{ticket.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{ticketCategoryLabels[ticket.category]}</td>
                  <td className="px-5 py-4"><Badge tone={priorityTones[ticket.priority]}>{ticketPriorityLabels[ticket.priority]}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={statusTones[ticket.status]}>{ticketStatusLabels[ticket.status]}</Badge></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{requesterNames.get(ticket.employee_id) ?? `User unavailable (#${ticket.employee_id})`}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </>
  )
}

export default DashboardPage
