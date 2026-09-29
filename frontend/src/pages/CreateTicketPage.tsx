import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createTicket, getTicketErrorMessage } from '../api/tickets'
import { getUsers } from '../api/users'
import TicketForm from '../components/tickets/TicketForm'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateTicketPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const creation = useMutation({
    mutationFn: createTicket,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'], exact: true })
      navigate('/tickets')
    },
  })

  return (
    <>
      <BackLink to="/tickets" />
      <PageHeader title="Create Ticket" description="Enter the details for the support request." />
      <TicketForm users={users.data ?? []} usersLoading={users.isPending} usersError={users.isError}
        usersFetching={users.isFetching} onRetryUsers={() => void users.refetch()}
        pending={creation.isPending} error={creation.isError ? getTicketErrorMessage(creation.error, 'create') : undefined}
        onSubmit={(data) => creation.mutate(data)} onCancel={() => navigate('/tickets')} />
    </>
  )
}

export default CreateTicketPage
