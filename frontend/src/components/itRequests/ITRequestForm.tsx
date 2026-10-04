import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { requestStatusLabels, requestTypeLabels } from '../../api/itRequests'
import type { ITRequestCreateInput, ITRequestUpdateInput, RequestStatus, RequestType } from '../../api/itRequests'
import type { User } from '../../api/users'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

type ITRequestFormProps = {
  users: User[]
  usersLoading: boolean
  usersError: boolean
  usersFetching: boolean
  onRetryUsers: () => void
  pending: boolean
  error?: string
  onCancel: () => void
} & (
  | { mode: 'create'; initialValues?: never; onSubmit: (data: ITRequestCreateInput) => void }
  | { mode: 'edit'; initialValues: ITRequestUpdateInput; onSubmit: (data: ITRequestUpdateInput) => void }
)

function ITRequestForm(props: ITRequestFormProps) {
  const { users, usersLoading, usersError, usersFetching, onRetryUsers, pending, error, onCancel, initialValues } = props
  const fieldId = useId()
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [requestType, setRequestType] = useState<RequestType | ''>(initialValues?.request_type ?? '')
  const [employeeId, setEmployeeId] = useState(initialValues ? String(initialValues.employee_id) : '')
  const [status, setStatus] = useState<RequestStatus | ''>(initialValues?.status ?? '')
  const [errors, setErrors] = useState<{ title?: string; description?: string; requester?: string }>({})
  const requestersUnavailable = usersLoading || usersError || users.length === 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || requestersUnavailable) return
    const employee_id = Number(employeeId)
    const nextErrors = {
      title: !title.trim() ? 'Enter a title.' : Array.from(title.trim()).length > 150 ? 'Use at most 150 characters.' : undefined,
      description: description.trim() ? undefined : 'Enter a description.',
      requester: users.some((user) => user.id === employee_id) ? undefined : 'Select an available requester.',
    }
    setErrors(nextErrors)
    if (nextErrors.title || nextErrors.description || nextErrors.requester || !requestType) return
    const data = { title: title.trim(), description: description.trim(), request_type: requestType, employee_id }
    if (props.mode === 'edit') {
      if (!status) return
      props.onSubmit({ ...data, status })
    } else props.onSubmit(data)
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Title" htmlFor={`${fieldId}-title`} error={errors.title}>
              <Input id={`${fieldId}-title`} name="title" value={title} required
                placeholder="Briefly describe the request" onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${fieldId}-title-error` : undefined} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Description" htmlFor={`${fieldId}-description`} error={errors.description}>
              <Textarea id={`${fieldId}-description`} name="description" value={description} required rows={5}
                placeholder="Provide details about the request" onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? `${fieldId}-description-error` : undefined} />
            </FormField>
          </div>
          <FormField label="Request Type" htmlFor={`${fieldId}-type`}>
            <Select id={`${fieldId}-type`} name="request_type" value={requestType} required onChange={(event) => setRequestType(event.target.value as RequestType | '')}>
              <option value="" disabled>Select a request type</option>
              {Object.entries(requestTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          <FormField label="Requester" htmlFor={`${fieldId}-requester`} error={errors.requester}>
            <Select id={`${fieldId}-requester`} name="employee_id" value={employeeId} required disabled={requestersUnavailable}
              onChange={(event) => setEmployeeId(event.target.value)} aria-invalid={Boolean(errors.requester)}
              aria-describedby={errors.requester ? `${fieldId}-requester-error` : undefined}>
              <option value="" disabled>{usersLoading ? 'Loading users...' : 'Select a requester'}</option>
              {!usersError && users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
          </FormField>
          {props.mode === 'edit' && (
            <FormField label="Status" htmlFor={`${fieldId}-status`}>
              <Select id={`${fieldId}-status`} name="status" value={status} required onChange={(event) => setStatus(event.target.value as RequestStatus)}>
                {Object.entries(requestStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </FormField>
          )}
        </fieldset>
        {usersError && <p role="alert" className="mt-4 text-sm text-red-700">Requesters could not be loaded. Please retry.</p>}
        {!usersLoading && !usersError && users.length === 0 && <p role="status" className="mt-4 text-sm text-slate-500">No users are available. Add a user before saving an IT request.</p>}
        {(usersError || (!usersLoading && users.length === 0) || error) && (
          <Button variant="ghost" className="mt-2" disabled={usersFetching || pending} onClick={onRetryUsers}>Refresh users</Button>
        )}
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending || requestersUnavailable}>{pending ? 'Saving...' : props.mode === 'edit' ? 'Save Changes' : 'Create IT Request'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default ITRequestForm
