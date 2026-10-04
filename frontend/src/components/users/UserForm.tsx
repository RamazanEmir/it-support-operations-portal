import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { userRoleLabels } from '../../api/users'
import type { UserCreateInput, UserUpdateInput, User, UserRole } from '../../api/users'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'

type UserFormProps = {
  submitLabel: string
  pending: boolean
  error?: string
  onCancel: () => void
} & (
  | { mode: 'create'; initialValues?: never; onSubmit: (data: UserCreateInput) => void }
  | { mode: 'edit'; initialValues?: User; onSubmit: (data: UserUpdateInput) => void }
)

function UserForm(props: UserFormProps) {
  const { initialValues, submitLabel, pending, error, onCancel } = props
  const fieldId = useId()
  const [name, setName] = useState(initialValues?.name ?? '')
  const [email, setEmail] = useState(initialValues?.email ?? '')
  const [role, setRole] = useState<UserRole | ''>(initialValues?.role ?? '')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (!name.trim()) {
      setNameError('Enter a name.')
      document.getElementById(`${fieldId}-name`)?.focus()
      return
    }
    if (Array.from(name.trim()).length > 100) {
      setNameError('Use at most 100 characters.')
      document.getElementById(`${fieldId}-name`)?.focus()
      return
    }
    if (Array.from(email.trim()).length > 254) {
      setEmailError('Use at most 254 characters.')
      document.getElementById(`${fieldId}-email`)?.focus()
      return
    }
    if (!email.trim() || !role) return
    const passwordLength = Array.from(password).length
    if ((props.mode === 'create' || password !== '') && (passwordLength < 12 || passwordLength > 128)) {
      setPasswordError('Use 12 to 128 characters for the password.')
      document.getElementById(`${fieldId}-password`)?.focus()
      return
    }
    const data = { name: name.trim(), email: email.trim(), role }
    if (props.mode === 'create') props.onSubmit({ ...data, password })
    else props.onSubmit({ ...data, ...(password !== '' ? { password } : {}) })
  }

  return (
    <Card className="max-w-2xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          <FormField label="Name" htmlFor={`${fieldId}-name`} error={nameError}>
            <Input
              id={`${fieldId}-name`} name="name" value={name} required
              autoComplete="name" placeholder="Full name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? `${fieldId}-name-error` : undefined}
              onChange={(event) => { setName(event.target.value); setNameError('') }}
            />
          </FormField>
          <FormField label="Email" htmlFor={`${fieldId}-email`} error={emailError}>
            <Input
              id={`${fieldId}-email`} name="email" type="email" value={email}
              required autoComplete="email" placeholder="name@company.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? `${fieldId}-email-error` : undefined}
              onChange={(event) => { setEmail(event.target.value); setEmailError('') }}
            />
          </FormField>
          <FormField label="Role" htmlFor={`${fieldId}-role`}>
            <Select id={`${fieldId}-role`} name="role" value={role} required onChange={(event) => setRole(event.target.value as UserRole | '')}>
              <option value="" disabled>Select a role</option>
              {Object.entries(userRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          <FormField label={props.mode === 'create' ? 'Password' : 'New Password (optional)'} htmlFor={`${fieldId}-password`} error={passwordError}>
            <Input id={`${fieldId}-password`} name="password" type="password" autoComplete="new-password"
              value={password} required={props.mode === 'create'}
              aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? `${fieldId}-password-error` : undefined}
              onChange={(event) => { setPassword(event.target.value); setPasswordError('') }} />
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
