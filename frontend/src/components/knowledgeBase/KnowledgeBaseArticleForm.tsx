import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { KnowledgeBaseArticleCreateInput } from '../../api/knowledgeBase'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'

type KnowledgeBaseArticleFormProps = {
  initialValues?: KnowledgeBaseArticleCreateInput
  pending: boolean
  error?: string
  onSubmit: (data: KnowledgeBaseArticleCreateInput) => void
  onCancel: () => void
}

function KnowledgeBaseArticleForm({ initialValues, pending, error, onSubmit, onCancel }: KnowledgeBaseArticleFormProps) {
  const fieldId = useId()
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [validationError, setValidationError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = { title: title.trim(), category: category.trim(), content: content.trim() }
    if (!data.title || Array.from(data.title).length > 200 || !data.category || Array.from(data.category).length > 100 || !data.content) {
      setValidationError('Enter a title up to 200 characters, a category up to 100 characters and article content.')
      return
    }
    setValidationError('')
    onSubmit(data)
  }

  return (
    <Card className="max-w-4xl p-5 sm:p-7">
      <form onSubmit={handleSubmit} aria-busy={pending}>
        <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Title" htmlFor={`${fieldId}-title`}>
            <Input id={`${fieldId}-title`} name="title" value={title} required onChange={(event) => setTitle(event.target.value)} />
          </FormField>
          <FormField label="Category" htmlFor={`${fieldId}-category`}>
            <Input id={`${fieldId}-category`} name="category" value={category} required onChange={(event) => setCategory(event.target.value)} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Content" htmlFor={`${fieldId}-content`}>
              <Textarea id={`${fieldId}-content`} name="content" value={content} required rows={12} onChange={(event) => setContent(event.target.value)} />
            </FormField>
          </div>
        </fieldset>
        {validationError && <p role="alert" className="mt-5 text-sm text-red-700">{validationError}</p>}
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving...' : initialValues ? 'Save Changes' : 'Add Article'}</Button>
        </div>
      </form>
    </Card>
  )
}

export default KnowledgeBaseArticleForm
