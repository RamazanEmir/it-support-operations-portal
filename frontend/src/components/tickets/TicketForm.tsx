import { useAuth } from '../../auth/AuthContext'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { ticketCategoryLabels, ticketPriorityLabels } from '../../api/tickets'
import type { TicketCategory, TicketCreateInput, TicketPriority } from '../../api/tickets'
import type { User } from '../../api/users'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

type TicketFormProps = {
  users: User[]
  usersLoading: boolean
  usersError: boolean
  usersFetching: boolean
  onRetryUsers: () => void
  pending: boolean
  error?: string
  onSubmit: (data: TicketCreateInput) => void
  onCancel: () => void
}

function TicketForm({ users, usersLoading, usersError, usersFetching, onRetryUsers, pending, error, onSubmit, onCancel }: TicketFormProps) {
  const { currentUser } = useAuth()
  const isEmployee = currentUser?.role === 'employee'
  const fieldId = useId()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory | ''>('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [employeeId, setEmployeeId] = useState('')
  const [errors, setErrors] = useState<{ title?: string; description?: string; requester?: string }>({})
  const requestersUnavailable = !isEmployee && (usersLoading || usersError || users.length === 0)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || requestersUnavailable) return
    const employee_id = Number(employeeId)
    const nextErrors = {
      title: !title.trim() ? 'Enter a title.' : Array.from(title.trim()).length > 150 ? 'Use at most 150 characters.' : undefined,
      description: description.trim() ? undefined : 'Enter a description.',
      requester: isEmployee || users.some((user) => user.id === employee_id) ? undefined : 'Select an available requester.',
    }
    setErrors(nextErrors)
    if (nextErrors.title || nextErrors.description || nextErrors.requester || !category || !priority) return
    onSubmit({ title: title.trim(), description: description.trim(), category, priority, ...(!isEmployee ? { employee_id } : {}) })
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Title" htmlFor={`${fieldId}-title`} error={errors.title}>
              <Input id={`${fieldId}-title`} name="title" value={title} required
                placeholder="Briefly describe the issue" onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${fieldId}-title-error` : undefined} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Description" htmlFor={`${fieldId}-description`} error={errors.description}>
              <Textarea id={`${fieldId}-description`} name="description" value={description} required rows={5}
                placeholder="Provide details about the issue" onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? `${fieldId}-description-error` : undefined} />
            </FormField>
          </div>
          <FormField label="Category" htmlFor={`${fieldId}-category`}>
            <Select id={`${fieldId}-category`} name="category" value={category} required onChange={(event) => setCategory(event.target.value as TicketCategory | '')}>
              <option value="" disabled>Select a category</option>
              {Object.entries(ticketCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor={`${fieldId}-priority`}>
            <Select id={`${fieldId}-priority`} name="priority" value={priority} required onChange={(event) => setPriority(event.target.value as TicketPriority | '')}>
              <option value="" disabled>Select a priority</option>
              {Object.entries(ticketPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          {!isEmployee && (<FormField label="Requester" htmlFor={`${fieldId}-requester`} error={errors.requester}>
            <Select id={`${fieldId}-requester`} name="employee_id" value={employeeId} required disabled={requestersUnavailable}
              onChange={(event) => setEmployeeId(event.target.value)} aria-invalid={Boolean(errors.requester)}
              aria-describedby={errors.requester ? `${fieldId}-requester-error` : undefined}>
              <option value="" disabled>{usersLoading ? 'Loading users...' : 'Select a requester'}</option>
              {!usersError && users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
          </FormField>)}
        </fieldset>
        {!isEmployee && usersError && <p role="alert" className="mt-4 text-sm text-red-700">Requesters could not be loaded. Please retry.</p>}
        {!isEmployee && !usersLoading && !usersError && users.length === 0 && <p role="status" className="mt-4 text-sm text-slate-500">No users are available. Add a user before creating a ticket.</p>}
        {!isEmployee && (usersError || (!usersLoading && users.length === 0) || error) && (
          <Button variant="ghost" className="mt-2" disabled={usersFetching || pending} onClick={onRetryUsers}>Refresh users</Button>
        )}
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending || requestersUnavailable}>{pending ? 'Creating...' : 'Create Ticket'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default TicketForm
