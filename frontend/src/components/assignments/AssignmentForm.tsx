import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Asset } from '../../api/assets'
import type { User } from '../../api/users'
import type { AssetAssignmentCreateInput } from '../../api/assignments'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Select from '../ui/Select'

type AssignmentFormProps = {
  assets: Asset[]
  users: User[]
  assetsLoading: boolean
  assetsError: boolean
  assetsFetching: boolean
  usersLoading: boolean
  usersError: boolean
  usersFetching: boolean
  onRetryAssets: () => void
  onRetryUsers: () => void
  pending: boolean
  error?: string
  onSubmit: (data: AssetAssignmentCreateInput) => void
  onCancel: () => void
}

function AssignmentForm({ assets, users, assetsLoading, assetsError, assetsFetching, usersLoading, usersError, usersFetching, onRetryAssets, onRetryUsers, pending, error, onSubmit, onCancel }: AssignmentFormProps) {
  const fieldId = useId()
  const [assetId, setAssetId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [validationError, setValidationError] = useState('')
  const availableAssets = assets.filter((asset) => asset.status === 'available')
  const assetsUnavailable = assetsLoading || assetsError || availableAssets.length === 0
  const usersUnavailable = usersLoading || usersError || users.length === 0
  const selectedAsset = availableAssets.some((asset) => String(asset.id) === assetId) ? assetId : ''
  const selectedEmployee = users.some((user) => String(user.id) === employeeId) ? employeeId : ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || assetsUnavailable || usersUnavailable) return
    const asset_id = Number(selectedAsset)
    const employee_id = Number(selectedEmployee)
    if (!availableAssets.some((asset) => asset.id === asset_id) || !users.some((user) => user.id === employee_id)) {
      setValidationError('Select an available asset and employee.')
      return
    }
    setValidationError('')
    onSubmit({ asset_id, employee_id })
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Asset" htmlFor={`${fieldId}-asset`}>
            <Select id={`${fieldId}-asset`} name="asset_id" value={selectedAsset} required disabled={assetsUnavailable} onChange={(event) => setAssetId(event.target.value)}>
              <option value="" disabled>{assetsLoading ? 'Loading assets...' : 'Select an available asset'}</option>
              {!assetsError && availableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.asset_tag} — {asset.name}</option>)}
            </Select>
            {assetsError && <p role="alert" className="mt-2 text-sm text-red-700">Assets could not be loaded.</p>}
            {!assetsLoading && !assetsError && availableAssets.length === 0 && <p role="status" className="mt-2 text-sm text-slate-500">No assets are available for assignment.</p>}
            <Button variant="ghost" className="mt-2" disabled={assetsFetching || pending} onClick={onRetryAssets}>Refresh assets</Button>
          </FormField>
          <FormField label="Employee" htmlFor={`${fieldId}-employee`}>
            <Select id={`${fieldId}-employee`} name="employee_id" value={selectedEmployee} required disabled={usersUnavailable} onChange={(event) => setEmployeeId(event.target.value)}>
              <option value="" disabled>{usersLoading ? 'Loading users...' : 'Select an employee'}</option>
              {!usersError && users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
            {usersError && <p role="alert" className="mt-2 text-sm text-red-700">Employees could not be loaded.</p>}
            {!usersLoading && !usersError && users.length === 0 && <p role="status" className="mt-2 text-sm text-slate-500">No users are available. Add a user before assigning an asset.</p>}
            <Button variant="ghost" className="mt-2" disabled={usersFetching || pending} onClick={onRetryUsers}>Refresh users</Button>
          </FormField>
        </fieldset>
        {validationError && <p role="alert" className="mt-5 text-sm text-red-700">{validationError}</p>}
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending || assetsUnavailable || usersUnavailable || !selectedAsset || !selectedEmployee}>{pending ? 'Assigning...' : 'Assign Asset'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default AssignmentForm
