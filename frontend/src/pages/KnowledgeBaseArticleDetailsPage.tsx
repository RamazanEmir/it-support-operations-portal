import { useAuth } from '../auth/AuthContext'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { deleteKnowledgeBaseArticle, getKnowledgeBaseArticle } from '../api/knowledgeBase'
import { formatArticleDate, getKnowledgeBaseErrorMessage } from '../components/knowledgeBase/knowledgeBasePresentation'
import BackLink from '../components/ui/BackLink'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'

function KnowledgeBaseArticleDetailsPage() {
  const { currentUser } = useAuth()
  const { id: routeId } = useParams()
  const id = Number(routeId)
  const validId = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deleting = useRef(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const article = useQuery({
    queryKey: ['knowledge-base', id], queryFn: () => getKnowledgeBaseArticle(id), enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })
  const deletion = useMutation({
    mutationFn: deleteKnowledgeBaseArticle,
    onSuccess: async (_, articleId) => {
      setConfirmDelete(false)
      navigate('/knowledge-base')
      queryClient.removeQueries({ queryKey: ['knowledge-base', articleId], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'list'] })
    },
    onSettled: () => { deleting.current = false },
  })
  const notFound = !validId || (article.error instanceof ApiError && article.error.status === 404)
  const data = article.data

  return (
    <>
      <BackLink to="/knowledge-base" />
      <PageHeader id="article-heading" title="Article Details" description="Knowledge Base article" />
      {notFound ? (
        <Card className="p-6"><p role="alert" className="text-sm text-slate-600">Article not found.</p></Card>
      ) : article.isPending ? (
        <p role="status" className="text-sm text-slate-500">Loading article...</p>
      ) : article.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-sm text-red-700">{getKnowledgeBaseErrorMessage(article.error)}</p>
          <Button variant="secondary" disabled={article.isFetching} onClick={() => void article.refetch()}>Retry</Button>
        </Card>
      ) : data && (
        <>
          {currentUser?.role !== 'employee' && (<div className="mb-5 flex gap-3">
            <Button variant="secondary" disabled={deletion.isPending} onClick={() => navigate(`/knowledge-base/${id}/edit`)}>Edit</Button>
            {currentUser?.role === 'admin' && (<Button variant="danger" disabled={deletion.isPending} onClick={() => { deletion.reset(); setConfirmDelete(true) }}>Delete</Button>)}
          </div>)}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,1fr)]">
            <Card className="min-w-0 p-6">
              <h2 className="mb-5 break-words text-xl font-semibold text-slate-900">{data.title}</h2>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.content}</p>
            </Card>
            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold">Details</h2></div>
              <div className="space-y-4 p-5">
                <DetailRow label="Category" value={data.category} />
                <DetailRow label="Created At" value={formatArticleDate(data.created_at)} />
                <DetailRow label="Updated At" value={formatArticleDate(data.updated_at)} />
              </div>
            </Card>
          </div>
        </>
      )}
      {currentUser?.role === 'admin' && confirmDelete && data && (
        <ConfirmDialog title="Delete article?" confirmLabel="Delete Article" pending={deletion.isPending}
          error={deletion.isError ? getKnowledgeBaseErrorMessage(deletion.error) : undefined}
          onConfirm={() => { if (!deleting.current) { deleting.current = true; deletion.mutate(id) } }}
          onCancel={() => { if (!deleting.current) setConfirmDelete(false) }} fallbackFocusId="article-heading">
          Are you sure you want to delete this article? This action cannot be undone.
        </ConfirmDialog>
      )}
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="shrink-0 text-sm text-slate-500">{label}</span><span className="min-w-0 break-words text-right text-sm font-medium text-slate-800">{value}</span></div>
}

export default KnowledgeBaseArticleDetailsPage
