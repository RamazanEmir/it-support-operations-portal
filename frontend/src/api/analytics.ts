import { request } from './client'
import type { TicketCategory, TicketPriority } from './tickets'
import type { RequestType } from './itRequests'
import type { AssetCategory } from './assets'

export type TicketsByCategoryItem = { category: TicketCategory; count: number }
export type TicketsByPriorityItem = { priority: TicketPriority; count: number }
export type ITRequestsByTypeItem = { request_type: RequestType; count: number }
export type AssetsByCategoryItem = { category: AssetCategory; count: number }
export type WorkLogsByTechnicianItem = {
  technician_id: number
  technician_name: string
  work_log_count: number
  total_duration_minutes: number
}
export type AnalyticsOverview = {
  tickets_by_category: TicketsByCategoryItem[]
  tickets_by_priority: TicketsByPriorityItem[]
  it_requests_by_type: ITRequestsByTypeItem[]
  assets_by_category: AssetsByCategoryItem[]
  work_logs_by_technician: WorkLogsByTechnicianItem[]
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const data = await request<AnalyticsOverview>('/analytics/overview')
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}
