import { request } from './client'

export type DashboardSummaryResponse = {
  users_total: number
  tickets: { total: number; open: number; in_progress: number; resolved: number; closed: number }
  it_requests: { total: number; pending: number; in_progress: number; completed: number; rejected: number }
  assets: { total: number; available: number; assigned: number; maintenance: number; retired: number }
  active_assignments: number
  work_logs: { total: number; total_duration_minutes: number }
  knowledge_base_articles: number
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const data = await request<DashboardSummaryResponse>('/dashboard/summary')
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}
