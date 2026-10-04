import { useAuth } from '../../auth/AuthContext'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../../api/users'
import { getTickets } from '../../api/tickets'
import { getITRequests } from '../../api/itRequests'
import type { WorkLogUpdateInput } from '../../api/workLogs'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

type RelationType = 'none' | 'ticket' | 'it_request'
type WorkLogFormProps = {
  initialValues?: WorkLogUpdateInput
  pending: boolean
  error?: string
  onSubmit: (data: WorkLogUpdateInput) => void
  onCancel: () => void
}

function WorkLogForm({ initialValues, pending, error, onSubmit, onCancel }: WorkLogFormProps) {
  const { currentUser } = useAuth()
  const isTechnician = currentUser?.role === 'technician'
  const fieldId = useId()
  const [technicianId, setTechnicianId] = useState(initialValues ? String(initialValues.technician_id) : '')
  const [relationType, setRelationType] = useState<RelationType>(initialValues?.ticket_id != null ? 'ticket' : initialValues?.it_request_id != null ? 'it_request' : 'none')
  const [relationId, setRelationId] = useState(String(initialValues?.ticket_id ?? initialValues?.it_request_id ?? ''))
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [duration, setDuration] = useState(initialValues ? String(initialValues.duration_minutes) : '')
  const [workDate, setWorkDate] = useState(initialValues?.work_date ?? '')
  const [validationError, setValidationError] = useState('')
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: !isTechnician })
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: getTickets, enabled: relationType === 'ticket' })
  const requests = useQuery({ queryKey: ['it-requests'], queryFn: getITRequests, enabled: relationType === 'it_request' })
  const technicians = (users.data ?? []).filter((user) => user.role === 'technician')
  const techniciansUnavailable = !isTechnician && (users.isPending || users.isError || technicians.length === 0)
  const relationQuery = relationType === 'ticket' ? tickets : requests
  const relatedRecords = relationType === 'none' ? [] : relationQuery.data ?? []
  const relationUnavailable = relationType !== 'none' && (relationQuery.isPending || relationQuery.isError || relatedRecords.length === 0)
  const selectedTechnician = technicians.some((user) => String(user.id) === technicianId) ? technicianId : ''
  const selectedRelation = relatedRecords.some((record) => String(record.id) === relationId) ? relationId : ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || techniciansUnavailable || relationUnavailable) return
    const technician_id = isTechnician ? currentUser.id : Number(selectedTechnician)
    const relatedId = Number(selectedRelation)
    const duration_minutes = Number(duration)
    if ((!isTechnician && !technicians.some((user) => user.id === technician_id)) ||
      (relationType !== 'none' && !relatedRecords.some((record) => record.id === relatedId)) ||
      !description.trim() || !Number.isInteger(duration_minutes) || duration_minutes <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
      setValidationError('Select a technician and related record if needed, enter a description, a positive whole number of minutes and a work date.')
      return
    }
    setValidationError('')
    onSubmit({ technician_id, ticket_id: relationType === 'ticket' ? relatedId : null,
      it_request_id: relationType === 'it_request' ? relatedId : null,
      description: description.trim(), duration_minutes, work_date: workDate })
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          {!isTechnician && (<FormField label="Technician" htmlFor={`${fieldId}-technician`}>
            <Select id={`${fieldId}-technician`} name="technician_id" value={selectedTechnician} required disabled={techniciansUnavailable} onChange={(event) => setTechnicianId(event.target.value)}>
              <option value="" disabled>{users.isPending ? 'Loading technicians...' : 'Select a technician'}</option>
              {!users.isError && technicians.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
            {users.isError && <p role="alert" className="mt-2 text-sm text-red-700">Technicians could not be loaded.</p>}
            {!users.isPending && !users.isError && technicians.length === 0 && <p role="status" className="mt-2 text-sm text-slate-500">No technicians are available.</p>}
            <Button variant="ghost" className="mt-2" disabled={users.isFetching || pending} onClick={() => void users.refetch()}>Refresh users</Button>
          </FormField>)}
          <FormField label="Related To" htmlFor={`${fieldId}-relation-type`}>
            <Select id={`${fieldId}-relation-type`} value={relationType} onChange={(event) => { setRelationType(event.target.value as RelationType); setRelationId('') }}>
              <option value="none">None</option><option value="ticket">Ticket</option><option value="it_request">IT Request</option>
            </Select>
          </FormField>
          {relationType !== 'none' && (
            <FormField label={relationType === 'ticket' ? 'Ticket' : 'IT Request'} htmlFor={`${fieldId}-record`}>
              <Select id={`${fieldId}-record`} value={selectedRelation} required disabled={relationUnavailable} onChange={(event) => setRelationId(event.target.value)}>
                <option value="" disabled>{relationQuery.isPending ? 'Loading records...' : 'Select a related record'}</option>
                {!relationQuery.isError && relatedRecords.map((record) => <option key={record.id} value={record.id}>#{record.id} — {record.title}</option>)}
              </Select>
              {relationQuery.isError && <p role="alert" className="mt-2 text-sm text-red-700">Related records could not be loaded.</p>}
              {!relationQuery.isPending && !relationQuery.isError && relatedRecords.length === 0 && <p role="status" className="mt-2 text-sm text-slate-500">No related records are available.</p>}
              <Button variant="ghost" className="mt-2" disabled={relationQuery.isFetching || pending} onClick={() => void relationQuery.refetch()}>Refresh records</Button>
            </FormField>
          )}
          <div className="sm:col-span-2">
            <FormField label="Description" htmlFor={`${fieldId}-description`}>
              <Textarea id={`${fieldId}-description`} name="description" value={description} required rows={5} onChange={(event) => setDescription(event.target.value)} />
            </FormField>
          </div>
          <FormField label="Duration Minutes" htmlFor={`${fieldId}-duration`}>
            <Input id={`${fieldId}-duration`} name="duration_minutes" type="number" min="1" step="1" value={duration} required onChange={(event) => setDuration(event.target.value)} />
          </FormField>
          <FormField label="Work Date" htmlFor={`${fieldId}-date`}>
            <Input id={`${fieldId}-date`} name="work_date" type="date" value={workDate} required onChange={(event) => setWorkDate(event.target.value)} />
          </FormField>
        </fieldset>
        {validationError && <p role="alert" className="mt-5 text-sm text-red-700">{validationError}</p>}
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending || techniciansUnavailable || relationUnavailable}>{pending ? 'Saving...' : initialValues ? 'Save Changes' : 'Add Work Log'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default WorkLogForm
