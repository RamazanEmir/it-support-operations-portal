import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createAssignment } from '../api/assignments'
import { getAssets } from '../api/assets'
import { getUsers } from '../api/users'
import AssignmentForm from '../components/assignments/AssignmentForm'
import { getAssignmentErrorMessage } from '../components/assignments/assignmentPresentation'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateAssignmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const assets = useQuery({ queryKey: ['assets'], queryFn: getAssets })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const creation = useMutation({
    mutationFn: createAssignment,
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assignments'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['assets'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['assets', data.asset_id], exact: true }),
      ])
      navigate('/assignments')
    },
    onError: async (error, data) => {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['assets'], exact: true }),
          queryClient.invalidateQueries({ queryKey: ['assets', data.asset_id], exact: true }),
          ...(error.status === 404 ? [queryClient.invalidateQueries({ queryKey: ['users'], exact: true })] : []),
        ])
      }
    },
    onSettled: () => { submitting.current = false },
  })

  return (
    <>
      <BackLink to="/assignments" />
      <PageHeader title="Assign Asset" description="Select an available asset and an employee." />
      <AssignmentForm assets={assets.data ?? []} users={users.data ?? []}
        assetsLoading={assets.isPending} assetsError={assets.isError} assetsFetching={assets.isFetching} onRetryAssets={() => void assets.refetch()}
        usersLoading={users.isPending} usersError={users.isError} usersFetching={users.isFetching} onRetryUsers={() => void users.refetch()}
        pending={creation.isPending} error={creation.isError ? getAssignmentErrorMessage(creation.error, 'create') : undefined}
        onSubmit={(data) => { if (!submitting.current) { submitting.current = true; creation.mutate(data) } }}
        onCancel={() => navigate('/assignments')} />
    </>
  )
}

export default CreateAssignmentPage
