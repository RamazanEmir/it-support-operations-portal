import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createAsset } from '../api/assets'
import AssetForm from '../components/assets/AssetForm'
import { getAssetErrorMessage } from '../components/assets/assetPresentation'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateAssetPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const creation = useMutation({
    mutationFn: createAsset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'], exact: true })
      navigate('/assets')
    },
    onSettled: () => { submitting.current = false },
  })

  return (
    <>
      <BackLink to="/assets" />
      <PageHeader title="Add Asset" description="Enter the details for the asset." />
      <AssetForm mode="create"
        pending={creation.isPending} error={creation.isError ? getAssetErrorMessage(creation.error, 'create') : undefined}
        onSubmit={(data) => { if (!submitting.current) { submitting.current = true; creation.mutate(data) } }}
        onCancel={() => navigate('/assets')} />
    </>
  )
}

export default CreateAssetPage
