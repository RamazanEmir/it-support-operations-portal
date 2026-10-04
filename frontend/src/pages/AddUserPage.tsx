import { useRef, useState } from 'react'
import type { UserCreateInput } from '../api/users'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createUser, getUserErrorMessage } from '../api/users'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'
import UserForm from '../components/users/UserForm'

function AddUserPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(data: UserCreateInput) {
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setError(undefined)
    try {
      await createUser(data)
      await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
      navigate('/users')
    } catch (error) {
      setError(getUserErrorMessage(error, 'save'))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <>
      <BackLink to="/users" />
      <PageHeader title="Add User" description="Create a new portal user." />
      <UserForm mode="create"
        submitLabel="Add User" pending={pending}
        error={error}
        onSubmit={(data) => void submit(data)} onCancel={() => navigate('/users')}
      />
    </>
  )
}

export default AddUserPage
