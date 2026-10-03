import { request } from './client'

export type KnowledgeBaseArticleCreateInput = { title: string; category: string; content: string }
export type KnowledgeBaseArticleUpdateInput = KnowledgeBaseArticleCreateInput
export type KnowledgeBaseArticle = KnowledgeBaseArticleCreateInput & {
  id: number
  created_at: string
  updated_at: string
}

function requireData<T>(data: T | undefined): T {
  if (data === undefined) throw new Error('The server returned an invalid response.')
  return data
}

export async function getKnowledgeBaseArticles(search = ''): Promise<KnowledgeBaseArticle[]> {
  const term = search.trim()
  const query = term ? `?${new URLSearchParams({ search: term })}` : ''
  return requireData(await request<KnowledgeBaseArticle[]>(`/knowledge-base${query}`))
}
export async function getKnowledgeBaseArticle(id: number): Promise<KnowledgeBaseArticle> {
  return requireData(await request<KnowledgeBaseArticle>(`/knowledge-base/${id}`))
}
export async function createKnowledgeBaseArticle(data: KnowledgeBaseArticleCreateInput): Promise<KnowledgeBaseArticle> {
  return requireData(await request<KnowledgeBaseArticle>('/knowledge-base', { method: 'POST', body: data }))
}
export async function updateKnowledgeBaseArticle(id: number, data: KnowledgeBaseArticleUpdateInput): Promise<KnowledgeBaseArticle> {
  return requireData(await request<KnowledgeBaseArticle>(`/knowledge-base/${id}`, { method: 'PUT', body: data }))
}
export async function deleteKnowledgeBaseArticle(id: number): Promise<void> {
  await request<void>(`/knowledge-base/${id}`, { method: 'DELETE' })
}
