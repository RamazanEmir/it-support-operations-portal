import { useAuth } from '../auth/AuthContext'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { deleteAsset, getAsset, assetStatusLabels, assetCategoryLabels } from '../api/assets'
import { formatAssetDate, getAssetErrorMessage, assetStatusTones } from '../components/assets/assetPresentation'
import BackLink from '../components/ui/BackLink'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'

function AssetDetailsPage() {
  const { currentUser } = useAuth()
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deleting = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const asset = useQuery({
    queryKey: ['assets', id], queryFn: () => getAsset(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const deletion = useMutation({
    mutationFn: deleteAsset,
    onSuccess: async (_, assetId) => {
      setConfirmDelete(false)
      navigate('/assets')
      queryClient.removeQueries({ queryKey: ['assets', assetId], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['assets'], exact: true })
    },
    onSettled: () => { deleting.current = false },
  })
  const notFound = !validId || (asset.error instanceof ApiError && asset.error.status === 404)
  const data = asset.data

  return (
    <>
      <BackLink to="/assets" />
      <PageHeader id="asset-heading" title={data && !notFound ? data.asset_tag : 'Asset Details'} description="Asset details" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Asset not found.</p></Card>
      ) : asset.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading asset...</p>
      ) : asset.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getAssetErrorMessage(asset.error, 'load')}</p>
          <Button variant="secondary" disabled={asset.isFetching} onClick={() => void asset.refetch()}>Retry</Button>
        </Card>
      ) : data && (
        <>
          <div className="mb-5 flex gap-3">
            <Button variant="secondary" disabled={deletion.isPending} onClick={() => navigate(`/assets/${id}/edit`)}>Edit</Button>
            {currentUser?.role === 'admin' && (<Button variant="danger" disabled={deletion.isPending} onClick={() => { deletion.reset(); setConfirmDelete(true) }}>Delete</Button>)}
          </div>
          <Card className="max-w-4xl overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="break-words text-xl font-semibold text-slate-900">{data.name}</h2></div>
            <div className="space-y-4 p-5">
              <DetailRow label="Asset Tag" value={data.asset_tag} />
              <DetailRow label="Category" value={assetCategoryLabels[data.category]} />
              <DetailRow label="Brand" value={data.brand} />
              <DetailRow label="Model" value={data.model} />
              <DetailRow label="Serial Number" value={data.serial_number} />
              <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">Status</span><Badge tone={assetStatusTones[data.status]}>{assetStatusLabels[data.status]}</Badge></div>
              <DetailRow label="Created" value={formatAssetDate(data.created_at)} />
              <DetailRow label="Updated" value={formatAssetDate(data.updated_at)} />
            </div>
          </Card>
        </>
      )}
      {currentUser?.role === 'admin' && confirmDelete && data && (
        <ConfirmDialog title="Delete asset?" confirmLabel="Delete Asset" pending={deletion.isPending}
          error={deletion.isError ? getAssetErrorMessage(deletion.error, 'delete') : undefined}
          onConfirm={() => { if (!deleting.current) { deleting.current = true; deletion.mutate(id) } }}
          onCancel={() => { if (!deleting.current) setConfirmDelete(false) }} fallbackFocusId="asset-heading">
          Are you sure you want to delete <strong>{data.asset_tag}</strong>? This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="shrink-0 text-sm text-slate-500">{label}</span><span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span></div>
}

export default AssetDetailsPage
