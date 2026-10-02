import { request } from './client'

export type WorkLogCreateInput = {
  technician_id: number
  ticket_id?: number | null
  it_request_id?: number | null
  description: string
  duration_minutes: number
  work_date: string
}
export type WorkLogUpdateInput = WorkLogCreateInput & { ticket_id: number | null; it_request_id: number | null }
export type WorkLog = WorkLogUpdateInput & { id: number; created_at: string }

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getWorkLogs(): Promise<WorkLog[]> {
  return requireData(await request<WorkLog[]>('/work-logs'))
}
export async function getWorkLog(id: number): Promise<WorkLog> {
  return requireData(await request<WorkLog>(`/work-logs/${id}`))
}
export async function createWorkLog(data: WorkLogCreateInput): Promise<WorkLog> {
  return requireData(await request<WorkLog>('/work-logs', { method: 'POST', body: data }))
}
export async function updateWorkLog(id: number, data: WorkLogUpdateInput): Promise<WorkLog> {
  return requireData(await request<WorkLog>(`/work-logs/${id}`, { method: 'PUT', body: data }))
}
export async function deleteWorkLog(id: number): Promise<void> {
  await request<void>(`/work-logs/${id}`, { method: 'DELETE' })
}
