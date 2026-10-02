import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getAssignments } from '../api/assignments'
import { getAssets } from '../api/assets'
import { getUsers } from '../api/users'
import { assignmentAssetLabel, assignmentEmployeeLabel, assignmentState, formatAssignmentDate, getAssignmentErrorMessage } from '../components/assignments/assignmentPresentation'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function AssignmentsPage() {
  const navigate = useNavigate()
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: getAssignments })
  const assets = useQuery({ queryKey: ['assets'], queryFn: getAssets })
  const users = useQuery({ queryKey: ['users'], queryFn: getUsers })

  return (
    <>
      <PageHeader title="Assignments" description={assignments.data ? `${assignments.data.length} asset assignments` : undefined}
        action={<Button onClick={() => navigate('/assignments/new')}><Icon name="plus" className="size-4" />Assign Asset</Button>} />
      {(assets.isError || users.isError) && <p role="status" className="mb-4 text-sm text-slate-500">Some asset or employee names are unavailable. IDs are shown instead.</p>}
      <Card className="overflow-hidden">
        {assignments.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading assignments...</p>
        ) : assignments.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getAssignmentErrorMessage(assignments.error, 'load')}</p>
            <Button variant="secondary" disabled={assignments.isFetching} onClick={() => void assignments.refetch()}>Retry</Button>
          </div>
        ) : assignments.data.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No assignments yet. Assign an asset to get started.</p>
        ) : (
          <Table label="Assignments" headers={['Asset', 'Employee', 'Assigned At', 'Status', 'Actions']}>
            {assignments.data.map((assignment) => {
              const state = assignmentState(assignment.returned_at)
              return (
                <tr key={assignment.id} className="hover:bg-slate-50">
                  <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800">{assignmentAssetLabel(assignment.asset_id, assets.isError ? [] : assets.data ?? [])}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{assignmentEmployeeLabel(assignment.employee_id, users.isError ? [] : users.data ?? [])}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{formatAssignmentDate(assignment.assigned_at)}</td>
                  <td className="px-5 py-4"><Badge tone={state.tone}>{state.label}</Badge></td>
                  <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View assignment ${assignment.id}`} onClick={() => navigate(`/assignments/${assignment.id}`)}>View</Button></td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>
    </>
  )
}

export default AssignmentsPage
