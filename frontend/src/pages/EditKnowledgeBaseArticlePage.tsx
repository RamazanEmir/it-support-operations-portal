import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getKnowledgeBaseArticle, updateKnowledgeBaseArticle } from '../api/knowledgeBase'
import type { KnowledgeBaseArticleUpdateInput } from '../api/knowledgeBase'
import KnowledgeBaseArticleForm from '../components/knowledgeBase/KnowledgeBaseArticleForm'
import { getKnowledgeBaseErrorMessage } from '../components/knowledgeBase/knowledgeBasePresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

function EditKnowledgeBaseArticlePage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const request = useQuery({
    queryKey: ['knowledge-base', id], queryFn: () => getKnowledgeBaseArticle(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const update = useMutation({
    mutationFn: ({ articleId, data }: { articleId: number; data: KnowledgeBaseArticleUpdateInput }) => updateKnowledgeBaseArticle(articleId, data),
    onSuccess: async (data) => {
      queryClient.setQueryData(['knowledge-base', data.id], data)
      await queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'list'] })
      navigate(`/knowledge-base/${data.id}`)
    },
    onSettled: () => { submitting.current = false },
  })
  const notFound = !validId || (!request.data && request.error instanceof ApiError && request.error.status === 404)

  return (
    <>
      <BackLink to={validId ? `/knowledge-base/${id}` : '/knowledge-base'} />
      <PageHeader title="Edit Article" description="Update the article information." />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Article not found.</p></Card>
      ) : request.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading article...</p>
      ) : request.isError && !request.data ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getKnowledgeBaseErrorMessage(request.error)}</p>
          <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
        </Card>
      ) : (
        <>
          {request.isError && (
            <div className="mb-5 space-y-3">
              <p role="alert" className="text-sm text-red-700">{getKnowledgeBaseErrorMessage(request.error)} Your changes are preserved.</p>
              <Button variant="secondary" disabled={request.isFetching} onClick={() => void request.refetch()}>Retry</Button>
            </div>
          )}
          <KnowledgeBaseArticleForm key={id} initialValues={request.data}
            pending={update.isPending} error={update.isError ? getKnowledgeBaseErrorMessage(update.error) : undefined}
            onSubmit={(data) => { if (!submitting.current) { submitting.current = true; update.mutate({ articleId: id, data }) } }}
            onCancel={() => navigate(`/knowledge-base/${id}`)} />
        </>
      )}
    </>
  )
}

export default EditKnowledgeBaseArticlePage
