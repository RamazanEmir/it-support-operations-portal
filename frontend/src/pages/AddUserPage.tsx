import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createUser, getUserErrorMessage } from '../api/users'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'
import UserForm from '../components/users/UserForm'

function AddUserPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const creation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
      navigate('/users')
    },
  })

  return (
    <>
      <BackLink to="/users" />
      <PageHeader title="Add User" description="Create a new portal user." />
      <UserForm
        submitLabel="Add User" pending={creation.isPending}
        error={creation.isError ? getUserErrorMessage(creation.error, 'save') : undefined}
        onSubmit={(data) => creation.mutate(data)} onCancel={() => navigate('/users')}
      />
    </>
  )
}

export default AddUserPage
