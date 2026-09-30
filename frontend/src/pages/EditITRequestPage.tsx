import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getITRequest, updateITRequest } from '../api/itRequests'
import type { ITRequestUpdateInput } from '../api/itRequests'
import { getUsers } from '../api/users'
import ITRequestForm from '../components/itRequests/ITRequestForm'
import { getITRequestErrorMessage } from '../components/itRequests/itRequestPresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

function EditITRequestPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const request = useQuery({
    queryKey: ['it-requests', id], queryFn: () => getITRequest(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: validId })
  const update = useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: ITRequestUpdateInput }) => updateITRequest(requestId, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['it-requests', data.id], data)
      await queryClient.invalidateQueries({ queryKey: ['it-requests'], exact: true })
      navigate(`/it-requests/${data.id}`)
    },
    onSettled: () => { submitting.current = false },
  })
  const notFound = !validId || (request.error instanceof ApiError && request.error.status === 404)

  return (
    <>
      <BackLink to={validId ? `/it-requests/${id}` : '/it-requests'} />
      <PageHeader title="Edit IT Request" description="Update the IT request information." />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">IT Request not found.</p></Card>
      ) : request.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading IT request...</p>
      ) : request.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getITRequestErrorMessage(request.error, 'load')}</p>
          <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
        </Card>
      ) : (
        <ITRequestForm key={id} mode="edit" initialValues={request.data} users={users.data ?? []}
          usersLoading={users.isPending} usersError={users.isError} usersFetching={users.isFetching} onRetryUsers={() => void users.refetch()}
          pending={update.isPending} error={update.isError ? getITRequestErrorMessage(update.error, 'update') : undefined}
          onSubmit={(data) => { if (!submitting.current) { submitting.current = true; update.mutate({ requestId: id, data }) } }}
          onCancel={() => navigate(`/it-requests/${id}`)} />
      )}
    </>
  )
}

export default EditITRequestPage
