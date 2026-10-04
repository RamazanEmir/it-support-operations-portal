import { useAuth } from '../auth/AuthContext'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getKnowledgeBaseArticles } from '../api/knowledgeBase'
import { formatArticleDate, getKnowledgeBaseErrorMessage } from '../components/knowledgeBase/knowledgeBasePresentation'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import FormField from '../components/ui/FormField'
import Icon from '../components/ui/Icon'
import Input from '../components/ui/Input'
import PageHeader from '../components/ui/PageHeader'
import Table from '../components/ui/Table'

function KnowledgeBasePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const articles = useQuery({
    queryKey: ['knowledge-base', 'list', appliedSearch],
    queryFn: () => getKnowledgeBaseArticles(appliedSearch),
  })

  return (
    <>
      <PageHeader title="Knowledge Base" description={articles.data ? `${articles.data.length} articles${appliedSearch ? ' found' : ''}` : undefined}
        action={currentUser?.role !== 'employee' && <Button onClick={() => navigate('/knowledge-base/new')}><Icon name="plus" className="size-4" />Add Article</Button>} />
      <form className="mb-6 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchInput.trim()) }}>
        <div className="min-w-0 flex-1 sm:max-w-md">
          <FormField label="Search articles" htmlFor="article-search">
            <Input id="article-search" type="search" value={searchInput} placeholder="Search title, category or content" onChange={(event) => setSearchInput(event.target.value)} />
          </FormField>
        </div>
        <Button type="submit">Search</Button>
        {(appliedSearch || searchInput) && <Button variant="secondary" onClick={() => { setSearchInput(''); setAppliedSearch('') }}>Clear</Button>}
      </form>
      <Card className="overflow-hidden">
        {articles.isPending ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">Loading articles...</p>
        ) : articles.isError ? (
          <div className="space-y-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-red-700">{getKnowledgeBaseErrorMessage(articles.error)}</p>
            <Button variant="secondary" disabled={articles.isFetching} onClick={() => void articles.refetch()}>Retry</Button>
          </div>
        ) : articles.data.length === 0 ? (
          <p role="status" className="px-6 py-12 text-center text-sm text-slate-500">{appliedSearch ? 'No matching articles.' : currentUser?.role === 'employee' ? 'No articles yet.' : 'No articles yet. Add an article to get started.'}</p>
        ) : (
          <Table label="Knowledge Base articles" headers={['Title', 'Category', 'Updated', 'Actions']}>
            {articles.data.map((article) => (
              <tr key={article.id} className="hover:bg-slate-50">
                <td className="max-w-72 px-5 py-4 text-sm font-medium text-slate-800"><div className="truncate">{article.title}</div></td>
                <td className="max-w-60 px-5 py-4 text-sm text-slate-600"><div className="truncate">{article.category}</div></td>
                <td className="px-5 py-4 text-sm text-slate-500">{formatArticleDate(article.updated_at)}</td>
                <td className="px-5 py-4"><Button variant="ghost" className="min-h-8 px-2.5" aria-label={`View article ${article.id}`} onClick={() => navigate(`/knowledge-base/${article.id}`)}>View</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}

export default KnowledgeBasePage
