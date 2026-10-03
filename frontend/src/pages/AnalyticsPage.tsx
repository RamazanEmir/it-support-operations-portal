import { useQuery } from '@tanstack/react-query'
import { getAnalyticsOverview } from '../api/analytics'
import { ticketCategoryLabels, ticketPriorityLabels } from '../api/tickets'
import { requestTypeLabels } from '../api/itRequests'
import { assetCategoryLabels } from '../api/assets'
import { formatDuration } from '../components/workLogs/workLogPresentation'
import AnalyticsSection from '../components/analytics/AnalyticsSection'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function AnalyticsPage() {
  const overview = useQuery({ queryKey: ['analytics', 'overview'], queryFn: getAnalyticsOverview })

  return (
    <>
      <PageHeader title="Analytics" description="Support, inventory and work log reports." />
      {overview.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading analytics...</p>
      ) : overview.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">Analytics could not be loaded. Please try again.</p>
          <Button variant="secondary" disabled={overview.isFetching} onClick={() => void overview.refetch()}>Retry</Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <AnalyticsSection title="Tickets by Category" labelHeading="Category"
              rows={overview.data.tickets_by_category.map((item) => ({ key: item.category, label: ticketCategoryLabels[item.category], count: item.count }))} />
            <AnalyticsSection title="Tickets by Priority" labelHeading="Priority"
              rows={overview.data.tickets_by_priority.map((item) => ({ key: item.priority, label: ticketPriorityLabels[item.priority], count: item.count }))} />
            <AnalyticsSection title="IT Requests by Type" labelHeading="Type"
              rows={overview.data.it_requests_by_type.map((item) => ({ key: item.request_type, label: requestTypeLabels[item.request_type], count: item.count }))} />
            <AnalyticsSection title="Assets by Category" labelHeading="Category"
              rows={overview.data.assets_by_category.map((item) => ({ key: item.category, label: assetCategoryLabels[item.category], count: item.count }))} />
          </div>
          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Work Logs by Technician</h2></div>
            {overview.data.work_logs_by_technician.length === 0 ? (
              <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">No work log analytics available yet.</p>
            ) : (
              <Table label="Work Logs by Technician" headers={['Technician', 'Work Logs', 'Total Duration']}>
                {overview.data.work_logs_by_technician.map((item) => (
                  <tr key={item.technician_id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{item.technician_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.work_log_count}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDuration(item.total_duration_minutes)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  )
}

export default AnalyticsPage
