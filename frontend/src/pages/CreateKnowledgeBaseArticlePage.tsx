import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { createKnowledgeBaseArticle } from '../api/knowledgeBase'
import KnowledgeBaseArticleForm from '../components/knowledgeBase/KnowledgeBaseArticleForm'
import { getKnowledgeBaseErrorMessage } from '../components/knowledgeBase/knowledgeBasePresentation'
import BackLink from '../components/ui/BackLink'
import PageHeader from '../components/ui/PageHeader'

function CreateKnowledgeBaseArticlePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submitting = useRef(false)
  const creation = useMutation({
    mutationFn: createKnowledgeBaseArticle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'list'] })
      navigate('/knowledge-base')
    },
    onSettled: () => { submitting.current = false },
  })

  return (
    <>
      <BackLink to="/knowledge-base" />
      <PageHeader title="Add Article" description="Enter the details for the article." />
      <KnowledgeBaseArticleForm
        pending={creation.isPending} error={creation.isError ? getKnowledgeBaseErrorMessage(creation.error) : undefined}
        onSubmit={(data) => { if (!submitting.current) { submitting.current = true; creation.mutate(data) } }}
        onCancel={() => navigate('/knowledge-base')} />
    </>
  )
}

export default CreateKnowledgeBaseArticlePage
