import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getWorkLogs } from '../api/workLogs'
import { getUsers } from '../api/users'
import { getTickets } from '../api/tickets'
import { getITRequests } from '../api/itRequests'
import { formatDuration, formatWorkDate, getWorkLogErrorMessage, technicianLabel, workLogRelationLabel } from '../components/workLogs/workLogPresentation'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function WorkLogsPage() {
  const navigate = useNavigate()
  const logs = useQuery({ queryKey: ['work-logs'], queryFn: getWorkLogs })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: getTickets })
  const requests = useQuery({ queryKey: ['it-requests'], queryFn: getITRequests })

  return (
    <>
      <PageHeader title="Work Logs" description={logs.data ? `${logs.data.length} work logs` : undefined}
        action={<Button onClick={() => navigate('/work-logs/new')}><Icon name="plus" className="size-4" />Add Work Log</Button>} />
      {(users.isError || tickets.isError || requests.isError) && <p role="status" className="mb-4 text-sm text-slate-500">Some technician or related record names are unavailable. IDs are shown instead.</p>}
      <Card className="overflow-hidden">
        {logs.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading work logs...</p>
        ) : logs.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getWorkLogErrorMessage(logs.error, 'load')}</p>
            <Button variant="secondary" disabled={logs.isFetching} onClick={() => void logs.refetch()}>Retry</Button>
          </div>
        ) : logs.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No work logs yet. Add a work log to get started.</p>
        ) : (
          <Table label="Work Logs" headers={['Technician', 'Related To', 'Description', 'Duration', 'Work Date', 'Actions']}>
            {logs.data.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-medium text-slate-800">{technicianLabel(log.technician_id, users.isError ? [] : users.data ?? [])}</td>
                <td className="max-w-72 px-5 py-4 text-sm text-slate-600"><div className="truncate">{workLogRelationLabel(log, tickets.isError ? [] : tickets.data ?? [], requests.isError ? [] : requests.data ?? [])}</div></td>
                <td className="max-w-72 px-5 py-4 text-sm text-slate-600"><div className="truncate">{log.description}</div></td>
                <td className="px-5 py-4 text-sm text-slate-600">{formatDuration(log.duration_minutes)}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{formatWorkDate(log.work_date)}</td>
                <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View work log ${log.id}`} onClick={() => navigate(`/work-logs/${log.id}`)}>View</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

export default WorkLogsPage
