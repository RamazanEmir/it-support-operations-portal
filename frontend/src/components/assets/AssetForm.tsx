import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { assetCategoryLabels, assetStatusLabels } from '../../api/assets'
import type { AssetCategory, AssetCreateInput, AssetStatus, AssetUpdateInput } from '../../api/assets'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Select from '../ui/Select'

type AssetFormProps = {
  pending: boolean
  error?: string
  onCancel: () => void
} & (
  | { mode: 'create'; initialValues?: never; onSubmit: (data: AssetCreateInput) => void }
  | { mode: 'edit'; initialValues: AssetUpdateInput; onSubmit: (data: AssetUpdateInput) => void }
)

const textFields = [
  { name: 'asset_tag', label: 'Asset Tag', maxLength: 50 },
  { name: 'name', label: 'Name', maxLength: 150 },
  { name: 'brand', label: 'Brand', maxLength: 100 },
  { name: 'model', label: 'Model', maxLength: 100 },
  { name: 'serial_number', label: 'Serial Number', maxLength: 100 },
] as const

function AssetForm(props: AssetFormProps) {
  const { initialValues, pending, error, onCancel } = props
  const fieldId = useId()
  const [fields, setFields] = useState({
    asset_tag: initialValues?.asset_tag ?? '', name: initialValues?.name ?? '',
    brand: initialValues?.brand ?? '', model: initialValues?.model ?? '', serial_number: initialValues?.serial_number ?? '',
  })
  const [category, setCategory] = useState<AssetCategory | ''>(initialValues?.category ?? '')
  const [status, setStatus] = useState<AssetStatus>(initialValues?.status ?? 'available')
  const [errors, setErrors] = useState<Partial<Record<keyof typeof fields, string>>>({})
  const assigned = props.mode === 'edit' && props.initialValues.status === 'assigned'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const nextErrors: Partial<Record<keyof typeof fields, string>> = {}
    for (const field of textFields) {
      const value = fields[field.name].trim()
      if (!value) nextErrors[field.name] = `Enter ${field.label.toLowerCase()}.`
      else if (Array.from(value).length > field.maxLength) nextErrors[field.name] = `Use at most ${field.maxLength} characters.`
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !category) return
    const data: AssetCreateInput = {
      asset_tag: fields.asset_tag.trim(), name: fields.name.trim(), category,
      brand: fields.brand.trim(), model: fields.model.trim(), serial_number: fields.serial_number.trim(),
    }
    if (props.mode === 'edit') {
      if (!assigned && status === 'assigned') return
      props.onSubmit({ ...data, status: assigned ? 'assigned' : status })
    } else props.onSubmit(data)
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          {textFields.map((field) => (
            <FormField key={field.name} label={field.label} htmlFor={`${fieldId}-${field.name}`} error={errors[field.name]}>
              <Input id={`${fieldId}-${field.name}`} name={field.name} value={fields[field.name]} required
                onChange={(event) => setFields({ ...fields, [field.name]: event.target.value })}
                aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${fieldId}-${field.name}-error` : undefined} />
            </FormField>
          ))}
          <FormField label="Category" htmlFor={`${fieldId}-category`}>
            <Select id={`${fieldId}-category`} name="category" value={category} required onChange={(event) => setCategory(event.target.value as AssetCategory | '')}>
              <option value="" disabled>Select a category</option>
              {Object.entries(assetCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </FormField>
          {props.mode === 'edit' && (
            <FormField label="Status" htmlFor={`${fieldId}-status`}>
              {assigned ? (
                <Input id={`${fieldId}-status`} value="Assigned" readOnly />
              ) : (
                <Select id={`${fieldId}-status`} name="status" value={status} required onChange={(event) => setStatus(event.target.value as AssetStatus)}>
                  {(['available', 'maintenance', 'retired'] as const).map((value) => <option key={value} value={value}>{assetStatusLabels[value]}</option>)}
                </Select>
              )}
            </FormField>
          )}
        </fieldset>
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving...' : props.mode === 'edit' ? 'Save Changes' : 'Add Asset'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default AssetForm
