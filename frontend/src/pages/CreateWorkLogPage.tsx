import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { createWorkLog } from '../api/workLogs'
import WorkLogForm from '../components/workLogs/WorkLogForm'
import { getWorkLogErrorMessage } from '../components/workLogs/workLogPresentation'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateWorkLogPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const creation = useMutation({
    mutationFn: createWorkLog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-logs'], exact: true })
      navigate('/work-logs')
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await queryClient.invalidateQueries({ queryKey: ['users'], exact: true })
    },
    onSettled: () => { submitting.current = false },
  })

  return (
    <>
      <BackLink to="/work-logs" />
      <PageHeader title="Add Work Log" description="Enter the details for the work log." />
      <WorkLogForm
        pending={creation.isPending} error={creation.isError ? getWorkLogErrorMessage(creation.error, 'save') : undefined}
        onSubmit={(data) => { if (!submitting.current) { submitting.current = true; creation.mutate(data) } }}
        onCancel={() => navigate('/work-logs')} />
    </>
  )
}

export default CreateWorkLogPage
