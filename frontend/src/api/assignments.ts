import { request } from './client'

export type AssetAssignmentCreateInput = { asset_id: number; employee_id: number }
export type AssetAssignment = AssetAssignmentCreateInput & {
  id: number
  assigned_at: string
  returned_at: string | null
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getAssignments(): Promise<AssetAssignment[]> {
  return requireData(await request<AssetAssignment[]>('/asset-assignments'))
}
export async function getAssignment(id: number): Promise<AssetAssignment> {
  return requireData(await request<AssetAssignment>(`/asset-assignments/${id}`))
}
export async function createAssignment(data: AssetAssignmentCreateInput): Promise<AssetAssignment> {
  return requireData(await request<AssetAssignment>('/asset-assignments', { method: 'POST', body: data }))
}
export async function returnAssignment(id: number): Promise<AssetAssignment> {
  return requireData(await request<AssetAssignment>(`/asset-assignments/${id}/return`, { method: 'POST' }))
}
