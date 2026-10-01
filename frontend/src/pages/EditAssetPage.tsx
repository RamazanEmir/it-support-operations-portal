import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getAsset, updateAsset } from '../api/assets'
import type { AssetUpdateInput } from '../api/assets'
import AssetForm from '../components/assets/AssetForm'
import { getAssetErrorMessage } from '../components/assets/assetPresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

function EditAssetPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const request = useQuery({
    queryKey: ['assets', id], queryFn: () => getAsset(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const update = useMutation({
    mutationFn: ({ assetId, data }: { assetId: number; data: AssetUpdateInput }) => updateAsset(assetId, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['assets', data.id], data)
      await queryClient.invalidateQueries({ queryKey: ['assets'], exact: true })
      navigate(`/assets/${data.id}`)
    },
    onSettled: () => { submitting.current = false },
  })
  const notFound = !validId || (request.error instanceof ApiError && request.error.status === 404)

  return (
    <>
      <BackLink to={validId ? `/assets/${id}` : '/assets'} />
      <PageHeader title="Edit Asset" description="Update the asset information." />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Asset not found.</p></Card>
      ) : request.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading asset...</p>
      ) : request.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getAssetErrorMessage(request.error, 'load')}</p>
          <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
        </Card>
      ) : (
        <AssetForm key={id} mode="edit" initialValues={request.data}
          pending={update.isPending} error={update.isError ? getAssetErrorMessage(update.error, 'update') : undefined}
          onSubmit={(data) => { if (!submitting.current) { submitting.current = true; update.mutate({ assetId: id, data }) } }}
          onCancel={() => navigate(`/assets/${id}`)} />
      )}
    </>
  )
}

export default EditAssetPage
