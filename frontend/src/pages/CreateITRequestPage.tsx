import { useAuth } from '../auth/AuthContext'
import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createITRequest } from '../api/itRequests'
import { getUsers } from '../api/users'
import ITRequestForm from '../components/itRequests/ITRequestForm'
import { getITRequestErrorMessage } from '../components/itRequests/itRequestPresentation'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateITRequestPage() {
  const { currentUser } = useAuth()
  const isEmployee = currentUser?.role === 'employee'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: !isEmployee })
  const creation = useMutation({
    mutationFn: createITRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['it-requests'], exact: true })
      navigate('/it-requests')
    },
    onSettled: () => { submitting.current = false },
  })

  return (
    <>
      <BackLink to="/it-requests" />
      <PageHeader title="Create IT Request" description="Enter the details for the IT request." />
      <ITRequestForm mode="create" users={users.data ?? []} usersLoading={users.isPending} usersError={users.isError}
        usersFetching={users.isFetching} onRetryUsers={() => void users.refetch()}
        pending={creation.isPending} error={creation.isError ? getITRequestErrorMessage(creation.error, 'create') : undefined}
        onSubmit={(data) => { if (!submitting.current) { submitting.current = true; creation.mutate(data) } }}
        onCancel={() => navigate('/it-requests')} />
    </>
  )
}

export default CreateITRequestPage
