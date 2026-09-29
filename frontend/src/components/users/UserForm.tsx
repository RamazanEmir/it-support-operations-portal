import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { userRoleLabels } from '../../api/users'
import type { UserCreateInput, UserRole } from '../../api/users'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'

type UserFormProps = {
  initialValues?: UserCreateInput
  submitLabel: string
  pending: boolean
  error?: string
  onSubmit: (data: UserCreateInput) => void
  onCancel: () => void
}

function UserForm({ initialValues, submitLabel, pending, error, onSubmit, onCancel }: UserFormProps) {
  const fieldId = useId()
  const [name, setName] = useState(initialValues?.name ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [role, setRole] = useState<UserRole | ''>(initialValues?.role ?? '')
  const [nameError, setNameError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (!name.trim()) {
      setNameError('Enter a name.')
      document.getElementById(`${fieldId}-name`)?.focus()
      return
    }
    if (!email.trim() || !role) return
    onSubmit({ name: name.trim(), email: email.trim(), role })
  }

  return (
    <Card className="max-w-2xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          <FormField label="Name" htmlFor={`${fieldId}-name`} error={nameError}>
            <Input
              id={`${fieldId}-name`} name="name" value={name} required maxLength={100}
              autoComplete="name" placeholder="Full name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? `${fieldId}-name-error` : undefined}
              onChange={(event) => { setName(event.target.value); setNameError('') }}
            />
          </FormField>
          <FormField label="Email" htmlFor={`${fieldId}-email`}>
            <Input
              id={`${fieldId}-email`} name="email" type="email" value={email}
              required maxLength={254} autoComplete="email" placeholder="name@company.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label="Role" htmlFor={`${fieldId}-role`}>
            <Select id={`${fieldId}-role`} name="role" value={role} required onChange={(event) => setRole(event.target.value as UserRole | '')}>
              <option value="" disabled>Select a role</option>
              {Object.entries(userRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
        </fieldset>
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving...' : submitLabel}</Button>
        </div>
      </form>
    </Card>
  )
}

export default UserForm
