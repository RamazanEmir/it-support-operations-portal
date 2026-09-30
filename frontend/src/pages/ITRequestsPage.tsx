import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getITRequests, requestStatusLabels, requestTypeLabels } from '../api/itRequests'
import { getUsers } from '../api/users'
import { formatRequestDate, getITRequestErrorMessage, requestStatusTones } from '../components/itRequests/itRequestPresentation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function ITRequestsPage() {
  const navigate = useNavigate()
  const requests = useQuery({ queryKey: ['it-requests'], queryFn: getITRequests })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const requesterNames = new Map((users.isError ? [] : users.data ?? []).map((user) => [user.id, user.name]))

  return (
    <>
      <PageHeader title="IT Requests" description={requests.data ? `${requests.data.length} IT requests` : undefined}
        action={<Button onClick={() => navigate('/it-requests/new')}><Icon name="plus" className="size-4" />Create IT Request</Button>} />
      {users.isError && <p role="status" className="mb-4 text-sm text-slate-500">Requester names are unavailable. User IDs are shown instead.</p>}
      <Card className="overflow-hidden">
        {requests.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading IT requests...</p>
        ) : requests.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getITRequestErrorMessage(requests.error, 'load')}</p>
            <Button variant="secondary" disabled={requests.isFetching} onClick={() => void requests.refetch()}>Retry</Button>
          </div>
        ) : requests.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No IT requests yet. Create a request to get started.</p>
        ) : (
          <Table label="IT Requests" headers={['Request / Title', 'Requester', 'Type', 'Status', 'Created', 'Actions']}>
            {requests.data.map((request) => (
              <tr key={request.id} className="hover:bg-slate-50">
                <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800"><div className="mb-1 font-semibold text-blue-700">#{request.id}</div>{request.title}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{requesterNames.get(request.employee_id) ?? `User unavailable (#${request.employee_id})`}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{requestTypeLabels[request.request_type]}</td>
                <td className="px-5 py-4"><Badge tone={requestStatusTones[request.status]}>{requestStatusLabels[request.status]}</Badge></td>
                <td className="px-5 py-4 text-sm text-slate-500">{formatRequestDate(request.created_at)}</td>
                <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View IT request ${request.id}`} onClick={() => navigate(`/it-requests/${request.id}`)}>View</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

export default ITRequestsPage
