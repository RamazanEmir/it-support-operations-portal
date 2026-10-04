import { useAuth } from '../auth/AuthContext'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { deleteWorkLog, getWorkLog } from '../api/workLogs'
import { getUsers } from '../api/users'
import { getTickets } from '../api/tickets'
import { getITRequests } from '../api/itRequests'
import { formatCreatedAt, formatDuration, formatWorkDate, getWorkLogErrorMessage, technicianLabel, workLogRelationLabel } from '../components/workLogs/workLogPresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'

function WorkLogDetailsPage() {
  const { currentUser } = useAuth()
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deleting = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const log = useQuery({
    queryKey: ['work-logs', id], queryFn: () => getWorkLog(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: validId })
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: getTickets, enabled: validId })
  const requests = useQuery({ queryKey: ['it-requests'], queryFn: getITRequests, enabled: validId })
  const deletion = useMutation({
    mutationFn: deleteWorkLog,
    onSuccess: async (_, workLogId) => {
      setConfirmDelete(false)
      navigate('/work-logs')
      queryClient.removeQueries({ queryKey: ['work-logs', workLogId], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['work-logs'], exact: true })
    },
    onSettled: () => { deleting.current = false },
  })
  const notFound = !validId || (log.error instanceof ApiError && log.error.status === 404)
  const data = log.data
  const canManage = currentUser?.role === 'admin' || (currentUser?.role === 'technician' && data?.technician_id === currentUser.id)

  return (
    <>
      <BackLink to="/work-logs" />
      <PageHeader id="work-log-heading" title={data && !notFound ? `Work Log #${data.id}` : 'Work Log Details'} description="Work log details" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Work Log not found.</p></Card>
      ) : log.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading work log...</p>
      ) : log.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getWorkLogErrorMessage(log.error, 'load')}</p>
          <Button variant="secondary" disabled={log.isFetching} onClick={() => void log.refetch()}>Retry</Button>
        </Card>
      ) : data && (
        <>
          {canManage && (<div className="mb-5 flex gap-3">
            <Button variant="secondary" disabled={deletion.isPending} onClick={() => navigate(`/work-logs/${id}/edit`)}>Edit</Button>
            <Button variant="danger" disabled={deletion.isPending} onClick={() => { deletion.reset(); setConfirmDelete(true) }}>Delete</Button>
          </div>)}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)]">
            <Card className="min-w-0 p-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h2>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.description}</p>
            </Card>
            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">Details</h2></div>
              <div className="space-y-4 p-5">
                <DetailRow label="Technician" value={technicianLabel(data.technician_id, users.isError ? [] : users.data ?? [])} />
                <DetailRow label="Related To" value={workLogRelationLabel(data, tickets.isError ? [] : tickets.data ?? [], requests.isError ? [] : requests.data ?? [])} />
                <DetailRow label="Duration" value={formatDuration(data.duration_minutes)} />
                <DetailRow label="Work Date" value={formatWorkDate(data.work_date)} />
                <DetailRow label="Created At" value={formatCreatedAt(data.created_at)} />
              </div>
            </Card>
          </div>
        </>
      )}
      {canManage && confirmDelete && data && (
        <ConfirmDialog title="Delete work log?" confirmLabel="Delete Work Log" pending={deletion.isPending}
          error={deletion.isError ? getWorkLogErrorMessage(deletion.error, 'delete') : undefined}
          onConfirm={() => { if (!deleting.current) { deleting.current = true; deletion.mutate(id) } }}
          onCancel={() => { if (!deleting.current) setConfirmDelete(false) }} fallbackFocusId="work-log-heading">
          Are you sure you want to delete Work Log #{data.id}? This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="shrink-0 text-sm text-slate-500">{label}</span><span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span></div>
}

export default WorkLogDetailsPage
