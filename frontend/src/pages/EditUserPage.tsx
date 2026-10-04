import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getUser, getUserErrorMessage, updateUser } from '../api/users'
import type { UserUpdateInput } from '../api/users'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import UserForm from '../components/users/UserForm'

function EditUserPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useQuery({
    queryKey: ['users', id], queryFn: () => getUser(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const update = useMutation({
    mutationFn: (data: UserUpdateInput) => updateUser(id, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['users', id], data)
      await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
      navigate('/users')
    },
  })
  const notFound = !validId || (!user.data && user.error instanceof ApiError && user.error.status === 404)

  return (
    <>
      <BackLink to="/users" />
      <PageHeader title="Edit User" description={user.data && !notFound ? `Update ${user.data.name}'s information.` : undefined} />
      {notFound ? (
        <Card className="max-w-2xl p-6"><p role="alert" className="text-sm text-slate-600">User not found.</p></Card>
      ) : user.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading user...</p>
      ) : user.isError && !user.data ? (
        <Card className="max-w-2xl space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getUserErrorMessage(user.error, 'load')}</p>
          <Button variant="secondary" disabled={user.isFetching} onClick={() => void user.refetch()}>Retry</Button>
        </Card>
      ) : (
        <>
          {user.isError && (
            <div className="mb-5 space-y-3">
              <p role="alert" className="text-sm text-red-700">{getUserErrorMessage(user.error, 'load')} Your changes are preserved.</p>
              <Button variant="secondary" disabled={user.isFetching} onClick={() => void user.refetch()}>Retry</Button>
            </div>
          )}
          <UserForm
            key={id} initialValues={user.data} submitLabel="Save Changes" pending={update.isPending}
            error={update.isError ? getUserErrorMessage(update.error, 'save') : undefined}
            onSubmit={(data) => update.mutate(data)} onCancel={() => navigate('/users')}
          />
        </>
      )}
    </>
  )
}

export default EditUserPage
