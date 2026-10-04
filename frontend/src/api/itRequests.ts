import { request } from './client'

export type RequestType = 'software_installation' | 'account_creation' | 'vpn_access' | 'permission_request' | 'hardware_request' | 'other'
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'
export type ITRequestCreateInput = {
  title: string
  description: string
  request_type: RequestType
  employee_id?: number
}
export type ITRequestUpdateInput = ITRequestCreateInput & { status: RequestStatus; employee_id: number }
export type ITRequest = ITRequestUpdateInput & { id: number; created_at: string; updated_at: string }

export const requestTypeLabels: Record<RequestType, string> = {
  software_installation: 'Software Installation', account_creation: 'Account Creation',
  vpn_access: 'VPN Access', permission_request: 'Permission Request', hardware_request: 'Hardware Request', other: 'Other',
}
export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected',
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getITRequests(): Promise<ITRequest[]> {
  return requireData(await request<ITRequest[]>('/it-requests'))
}
export async function getITRequest(id: number): Promise<ITRequest> {
  return requireData(await request<ITRequest>(`/it-requests/${id}`))
}
export async function createITRequest(data: ITRequestCreateInput): Promise<ITRequest> {
  return requireData(await request<ITRequest>('/it-requests', { method: 'POST', body: data }))
}
export async function updateITRequest(id: number, data: ITRequestUpdateInput): Promise<ITRequest> {
  return requireData(await request<ITRequest>(`/it-requests/${id}`, { method: 'PUT', body: data }))
}
export async function deleteITRequest(id: number): Promise<void> {
  await request<void>(`/it-requests/${id}`, { method: 'DELETE' })
}
