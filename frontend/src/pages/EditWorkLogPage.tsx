import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getWorkLog, updateWorkLog } from '../api/workLogs'
import type { WorkLogUpdateInput } from '../api/workLogs'
import WorkLogForm from '../components/workLogs/WorkLogForm'
import { getWorkLogErrorMessage } from '../components/workLogs/workLogPresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

function EditWorkLogPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const request = useQuery({
    queryKey: ['work-logs', id], queryFn: () => getWorkLog(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const update = useMutation({
    mutationFn: ({ workLogId, data }: { workLogId: number; data: WorkLogUpdateInput }) => updateWorkLog(workLogId, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['work-logs', data.id], data)
      await queryClient.invalidateQueries({ queryKey: ['work-logs'], exact: true })
      navigate(`/work-logs/${data.id}`)
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
    },
    onSettled: () => { submitting.current = false },
  })
  const notFound = !validId || (!request.data && request.error instanceof ApiError && request.error.status === 404)

  return (
    <>
      <BackLink to={validId ? `/work-logs/${id}` : '/work-logs'} />
      <PageHeader title="Edit Work Log" description="Update the work log information." />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Work Log not found.</p></Card>
      ) : request.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading work log...</p>
      ) : request.isError && !request.data ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getWorkLogErrorMessage(request.error, 'load')}</p>
          <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
        </Card>
      ) : (
        <>
          {request.isError && (
            <div className="mb-5 space-y-3">
              <p role="alert" className="text-sm text-red-700">{getWorkLogErrorMessage(request.error, 'load')} Your changes are preserved.</p>
              <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
            </div>
          )}
          <WorkLogForm key={id} initialValues={request.data}
            pending={update.isPending} error={update.isError ? getWorkLogErrorMessage(update.error, 'save') : undefined}
            onSubmit={(data) => { if (!submitting.current) { submitting.current = true; update.mutate({ workLogId: id, data }) } }}
            onCancel={() => navigate(`/work-logs/${id}`)} />
        </>
      )}
    </>
  )
}

export default EditWorkLogPage
