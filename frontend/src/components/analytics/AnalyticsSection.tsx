import Card from '../ui/Card'
import Table from '../ui/Table'

type AnalyticsSectionProps = {
  title: string
  labelHeading: string
  rows: { key: string; label: string; count: number }[]
}

function AnalyticsSection({ title, labelHeading, rows }: AnalyticsSectionProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">{title}</h2></div>
      <Table label={title} headers={[labelHeading, 'Count']}>
        {rows.map((row) => (
          <tr key={row.key} className="hover:bg-slate-50">
            <td className="px-5 py-4 text-sm font-medium text-slate-800">{row.label}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{row.count}</td>
          </tr>
        ))}
      </Table>
    </Card>
  )
}

export default AnalyticsSection
