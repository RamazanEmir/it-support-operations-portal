import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { deleteUser, getUserErrorMessage, getUsers, userRoleLabels } from '../api/users'
import type { User, UserRole } from '../api/users'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

const roleTones: Record<UserRole, 'violet' | 'blue' | 'slate'> = {
  admin: 'violet', technician: 'blue', employee: 'slate',
}

function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const deletion = useMutation({
    mutationFn: deleteUser,
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: ['users', id], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
      setSelectedUser(null)
    },
  })

  return (
    <>
      <PageHeader
        id="users-heading" title="Users"
        description={users.data ? `${users.data.length} portal users` : undefined}
        action={<Button onClick={() => navigate('/users/new')}><Icon name="plus" className="size-4" />Add User</Button>}
      />
      <Card className="overflow-hidden">
        {users.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading users...</p>
        ) : users.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getUserErrorMessage(users.error, 'load')}</p>
            <Button variant="secondary" disabled={users.isFetching} onClick={() => void users.refetch()}>Retry</Button>
          </div>
        ) : users.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No users yet. Add a user to get started.</p>
        ) : (
          <Table label="Users" headers={['Name', 'Email', 'Role', 'Actions']}>
            {users.data.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                <td className="px-5 py-4"><Badge tone={roleTones[user.role]}>{userRoleLabels[user.role]}</Badge></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className="min-h-8 px-2.5" aria-label={`Edit ${user.name}`} onClick={() => navigate(`/users/${user.id}/edit`)}>Edit</Button>
                    <Button
                      variant="ghost" className="min-h-8 px-2.5 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${user.name}`}
                      onClick={() => { deletion.reset(); setSelectedUser(user) }}
                    >Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {selectedUser && (
        <ConfirmDialog
          title="Delete user?" confirmLabel="Delete User" pending={deletion.isPending}
          error={deletion.isError ? getUserErrorMessage(deletion.error, 'delete') : undefined}
          onConfirm={() => { if (!deletion.isPending) deletion.mutate(selectedUser.id) }}
          onCancel={() => { if (!deletion.isPending) setSelectedUser(null) }}
          fallbackFocusId="users-heading"
        >
          Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

export default UsersPage
