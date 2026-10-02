import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getAssignment, returnAssignment } from '../api/assignments'
import { getAssets } from '../api/assets'
import { getUsers } from '../api/users'
import { assignmentAssetLabel, assignmentEmployeeLabel, assignmentState, formatAssignmentDate, getAssignmentErrorMessage } from '../components/assignments/assignmentPresentation'
import BackLink from '../components/ui/BackLink'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

function AssignmentDetailsPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const queryClient = useQueryClient()
  const returning = useRef(false)
  const assignment = useQuery({
    queryKey: ['assignments', id], queryFn: () => getAssignment(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const assets = useQuery({ queryKey: ['assets'], queryFn: getAssets, enabled: validId })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: validId })
  const returnMutation = useMutation({
    mutationFn: ({ assignmentId }: { assignmentId: number; assetId: number }) => returnAssignment(assignmentId),
    onSuccess: async (data) => {
      queryClient.setQueryData(['assignments', data.id], data)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assignments'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['assets'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['assets', data.asset_id], exact: true }),
      ])
    },
    onError: async (error, data) => {
      if (error instanceof ApiError && error.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['assignments'], exact: true }),
          queryClient.invalidateQueries({ queryKey: ['assignments', data.assignmentId], exact: true }),
          queryClient.invalidateQueries({ queryKey: ['assets'], exact: true }),
          queryClient.invalidateQueries({ queryKey: ['assets', data.assetId], exact: true }),
        ])
      }
    },
    onSettled: () => { returning.current = false },
  })
  const notFound = !validId || (assignment.error instanceof ApiError && assignment.error.status === 404)
  const data = assignment.data
  const state = data ? assignmentState(data.returned_at) : undefined

  return (
    <>
      <BackLink to="/assignments" />
      <PageHeader title={data && !notFound ? `Assignment #${data.id}` : 'Assignment Details'} description="Asset assignment details" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Assignment not found.</p></Card>
      ) : assignment.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading assignment...</p>
      ) : assignment.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getAssignmentErrorMessage(assignment.error, 'load')}</p>
          <Button variant="secondary" disabled={assignment.isFetching} onClick={() => void assignment.refetch()}>Retry</Button>
        </Card>
      ) : data && state && (
        <Card className="max-w-4xl overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">Details</h2></div>
          <div className="space-y-4 p-5">
            <DetailRow label="Asset" value={assignmentAssetLabel(data.asset_id, assets.isError ? [] : assets.data ?? [])} />
            <DetailRow label="Employee" value={assignmentEmployeeLabel(data.employee_id, users.isError ? [] : users.data ?? [])} />
            <DetailRow label="Assigned At" value={formatAssignmentDate(data.assigned_at)} />
            <DetailRow label="Returned At" value={formatAssignmentDate(data.returned_at)} />
            <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">Status</span><Badge tone={state.tone}>{state.label}</Badge></div>
            {returnMutation.isError && <p role="alert" className="text-sm text-red-700">{getAssignmentErrorMessage(returnMutation.error, 'return')}</p>}
            {data.returned_at === null && (
              <div className="border-t border-slate-200 pt-5">
                <Button variant="secondary" disabled={returnMutation.isPending} onClick={() => {
                  if (!returning.current) {
                    returning.current = true
                    returnMutation.mutate({ assignmentId: data.id, assetId: data.asset_id })
                  }
                }}>{returnMutation.isPending ? 'Returning...' : 'Return Asset'}</Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="shrink-0 text-sm text-slate-500">{label}</span><span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span></div>
}

export default AssignmentDetailsPage
