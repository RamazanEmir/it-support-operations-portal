import { useAuth } from '../auth/AuthContext'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { deleteITRequest, getITRequest, requestStatusLabels, requestTypeLabels } from '../api/itRequests'
import { getUsers } from '../api/users'
import { formatRequestDate, getITRequestErrorMessage, requestStatusTones } from '../components/itRequests/itRequestPresentation'
import BackLink from '../components/ui/BackLink'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'

function ITRequestDetailsPage() {
  const { currentUser } = useAuth()
  const isEmployee = currentUser?.role === 'employee'
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deleting = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const request = useQuery({
    queryKey: ['it-requests', id], queryFn: () => getITRequest(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: validId && !isEmployee })
  const deletion = useMutation({
    mutationFn: deleteITRequest,
    onSuccess: async (_, requestId) => {
      setConfirmDelete(false)
      navigate('/it-requests')
      queryClient.removeQueries({ queryKey: ['it-requests', requestId], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['it-requests'], exact: true })
    },
    onSettled: () => { deleting.current = false },
  })
  const notFound = !validId || (request.error instanceof ApiError && request.error.status === 404)
  const data = request.data
  const requester = isEmployee ? currentUser : users.isError ? undefined : users.data?.find((user) => user.id === data?.employee_id)

  return (
    <>
      <BackLink to="/it-requests" />
      <PageHeader id="it-request-heading" title={data && !notFound ? `#${data.id}` : 'IT Request Details'} description="IT request details" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">IT Request not found.</p></Card>
      ) : request.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading IT request...</p>
      ) : request.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getITRequestErrorMessage(request.error, 'load')}</p>
          <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
        </Card>
      ) : data && (
        <>
          {currentUser?.role !== 'employee' && (<div className="mb-5 flex gap-3">
            <Button variant="secondary" disabled={deletion.isPending} onClick={() => navigate(`/it-requests/${id}/edit`)}>Edit</Button>
            {currentUser?.role === 'admin' && (<Button variant="danger" disabled={deletion.isPending} onClick={() => { deletion.reset(); setConfirmDelete(true) }}>Delete</Button>)}
          </div>)}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)]">
            <Card className="min-w-0 p-6">
              <h2 className="break-words text-xl font-semibold text-slate-900">{data.title}</h2>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h3>
                <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.description}</p>
              </div>
            </Card>
            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">Details</h2></div>
              <div className="space-y-4 p-5">
                <DetailRow label="Request Type" value={requestTypeLabels[data.request_type]} />
                <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">Status</span><Badge tone={requestStatusTones[data.status]}>{requestStatusLabels[data.status]}</Badge></div>
                <DetailRow label="Requester" value={requester?.name ?? `User unavailable (#${data.employee_id})`} />
                <DetailRow label="Created At" value={formatRequestDate(data.created_at)} />
                <DetailRow label="Updated At" value={formatRequestDate(data.updated_at)} />
              </div>
            </Card>
          </div>
        </>
      )}
      {currentUser?.role === 'admin' && confirmDelete && data && (
        <ConfirmDialog title="Delete IT request?" confirmLabel="Delete IT Request" pending={deletion.isPending}
          error={deletion.isError ? getITRequestErrorMessage(deletion.error, 'delete') : undefined}
          onConfirm={() => { if (!deleting.current) { deleting.current = true; deletion.mutate(id) } }}
          onCancel={() => { if (!deleting.current) setConfirmDelete(false) }} fallbackFocusId="it-request-heading">
          Are you sure you want to delete <strong>{data.title}</strong>? This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="shrink-0 text-sm text-slate-500">{label}</span><span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span></div>
}

export default ITRequestDetailsPage
