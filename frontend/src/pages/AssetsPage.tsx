import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getAssets, assetCategoryLabels, assetStatusLabels } from '../api/assets'
import { getAssetErrorMessage, assetStatusTones } from '../components/assets/assetPresentation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function AssetsPage() {
  const navigate = useNavigate()
  const assets = useQuery({ queryKey: ['assets'], queryFn: getAssets })

  return (
    <>
      <PageHeader title="Assets" description={assets.data ? `${assets.data.length} assets` : undefined}
        action={<Button onClick={() => navigate('/assets/new')}><Icon name="plus" className="size-4" />Add Asset</Button>} />
      <Card className="overflow-hidden">
        {assets.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading assets...</p>
        ) : assets.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getAssetErrorMessage(assets.error, 'load')}</p>
            <Button variant="secondary" disabled={assets.isFetching} onClick={() => void assets.refetch()}>Retry</Button>
          </div>
        ) : assets.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No assets yet. Add an asset to get started.</p>
        ) : (
          <Table label="Assets" headers={['Asset Tag', 'Name', 'Category', 'Brand / Model', 'Status', 'Actions']}>
            {assets.data.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold text-blue-700">{asset.asset_tag}</td>
                <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800">{asset.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{assetCategoryLabels[asset.category]}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{asset.brand} / {asset.model}</td>
                <td className="px-5 py-4"><Badge tone={assetStatusTones[asset.status]}>{assetStatusLabels[asset.status]}</Badge></td>
                <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View asset ${asset.asset_tag}`} onClick={() => navigate(`/assets/${asset.id}`)}>View</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

export default AssetsPage
