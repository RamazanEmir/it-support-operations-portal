import { request } from './client'

export type AssetCategory = 'laptop' | 'desktop' | 'monitor' | 'phone' | 'printer' | 'network_device' | 'other'
export type AssetStatus = 'available' | 'assigned' | 'maintenance' | 'retired'
export type AssetCreateInput = {
  asset_tag: string
  name: string
  category: AssetCategory
  brand: string
  model: string
  serial_number: string
}
export type AssetUpdateInput = AssetCreateInput & { status: AssetStatus }
export type Asset = AssetUpdateInput & { id: number; created_at: string; updated_at: string }

export const assetCategoryLabels: Record<AssetCategory, string> = {
  laptop: 'Laptop', desktop: 'Desktop', monitor: 'Monitor', phone: 'Phone', printer: 'Printer', network_device: 'Network Device', other: 'Other',
}
export const assetStatusLabels: Record<AssetStatus, string> = {
  available: 'Available', assigned: 'Assigned', maintenance: 'Maintenance', retired: 'Retired',
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getAssets(): Promise<Asset[]> {
  return requireData(await request<Asset[]>('/assets'))
}
export async function getAsset(id: number): Promise<Asset> {
  return requireData(await request<Asset>(`/assets/${id}`))
}
export async function createAsset(data: AssetCreateInput): Promise<Asset> {
  return requireData(await request<Asset>('/assets', { method: 'POST', body: data }))
}
export async function updateAsset(id: number, data: AssetUpdateInput): Promise<Asset> {
  return requireData(await request<Asset>(`/assets/${id}`, { method: 'PUT', body: data }))
}
export async function deleteAsset(id: number): Promise<void> {
  await request<void>(`/assets/${id}`, { method: 'DELETE' })
}
