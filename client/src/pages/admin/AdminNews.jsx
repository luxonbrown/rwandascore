import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, EyeOff, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import FormModal from '../../components/admin/FormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import SearchField from '../../components/ui/SearchField'
import {
  useAdminCollection,
  useCreateAdminItem,
  useDeleteAdminItem,
  useUpdateAdminItem,
} from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { formatDateTime } from '../../utils/format'
import { cn } from '../../utils/cn'

const categories = [
  { key: 'rpl', value: 'Rwanda Premier League' },
  { key: 'peace-cup', value: 'Peace Cup' },
  { key: 'amavubi', value: 'Amavubi' },
  { key: 'grassroots', value: 'Grassroots' },
  { key: 'transfers', value: 'Transfers' },
  { key: 'analysis', value: 'Analysis' },
]

function categoryKey(value) {
  return categories.find((category) => category.value === value)?.key || 'rpl'
}

function defaultForm(author) {
  return {
    title: '',
    slug: '',
    category: categories[0].value,
    source: 'RwandaScore Newsroom',
    author: author || 'RwandaScore',
    image: '',
    excerpt: '',
    body: '',
    featured: false,
    status: 'published',
  }
}

function articleToForm(article) {
  return {
    ...defaultForm(),
    ...article,
    image: article.imageUrl || article.image || '',
    body: Array.isArray(article.content)
      ? article.content.join('\n\n')
      : article.content || article.body || '',
  }
}

function NewsForm({ initial, onSubmit, onClose, isPending, error }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <FormModal
      open
      onClose={onClose}
      size="xl"
      title={initial.id ? t('admin.news.editTitle') : t('admin.news.new')}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
      isPending={isPending}
      error={error}
      submitLabel={initial.id ? t('admin.save') : t('admin.create')}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="news-title" className="label">
            {t('admin.form.title')} *
          </label>
          <input
            id="news-title"
            className="input"
            required
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="news-slug" className="label">
            {t('admin.form.slug')}
          </label>
          <input
            id="news-slug"
            className="input"
            placeholder="auto-generated"
            value={form.slug}
            onChange={(event) => set('slug', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="news-category" className="label">
            {t('admin.form.category')}
          </label>
          <select
            id="news-category"
            className="input"
            value={form.category}
            onChange={(event) => set('category', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.key} value={category.value}>
                {t(`news.categories.${category.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="news-status" className="label">Publication status</label>
          <select id="news-status" className="input" value={form.status || 'draft'} onChange={(event) => set('status', event.target.value)}>
            <option value="published">Published on website</option>
            <option value="draft">Save as draft</option>
          </select>
        </div>
        <div>
          <label htmlFor="news-source" className="label">
            {t('admin.form.source')}
          </label>
          <input
            id="news-source"
            className="input"
            value={form.source}
            onChange={(event) => set('source', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="news-author" className="label">
            {t('admin.form.author')}
          </label>
          <input
            id="news-author"
            className="input"
            value={form.author}
            onChange={(event) => set('author', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="news-image" className="label">
            {t('admin.form.image')}
          </label>
          <input
            id="news-image"
            type="url"
            className="input"
            placeholder="https://…"
            value={form.image}
            onChange={(event) => set('image', event.target.value)}
          />
          <Link to="/admin/uploads" className="mt-1 inline-block text-[11px] font-semibold text-accent hover:underline">
            {t('admin.uploads.browse')}
          </Link>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="news-excerpt" className="label">
            {t('admin.form.excerpt')}
          </label>
          <textarea
            id="news-excerpt"
            className="input min-h-20"
            maxLength={320}
            value={form.excerpt}
            onChange={(event) => set('excerpt', event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="news-body" className="label">
            {t('admin.form.body')} *
          </label>
          <textarea
            id="news-body"
            className="input min-h-52 font-mono text-xs leading-relaxed"
            required
            value={form.body}
            onChange={(event) => set('body', event.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted">{t('admin.form.bodyHint')}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-white sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.featured)}
            onChange={(event) => set('featured', event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t('admin.form.featured')}
        </label>
      </div>
    </FormModal>
  )
}

export default function AdminNews() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.news.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const pushToast = useUiStore((state) => state.pushToast)
  const newsQuery = useAdminCollection('news')
  const createItem = useCreateAdminItem('news')
  const updateItem = useUpdateAdminItem('news')
  const deleteItem = useDeleteAdminItem('news')
  const [editor, setEditor] = useState(() =>
    searchParams.get('new') === '1' ? defaultForm(user?.name) : null,
  )
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
    if (searchParams.get('new')) setSearchParams({}, { replace: true })
  }

  const openCreate = () => {
    setFormError('')
    setEditor(defaultForm(user?.name))
  }

  const openEdit = (article) => {
    setFormError('')
    setEditor({ ...articleToForm(article), id: article.id })
  }

  const save = async (form) => {
    setFormError('')
    const { id } = form
    const payload = {
      title: form.title,
      slug: form.slug?.trim() || undefined,
      excerpt: form.excerpt?.trim() || form.body.slice(0, 200),
      content: form.body,
      category: form.category,
      imageUrl: form.image?.trim() || null,
      featured: Boolean(form.featured),
          status: form.status || 'draft',
    }
    try {
      if (id) {
        await updateItem.mutateAsync({ id, ...payload })
        pushToast(t('admin.recordSaved'))
      } else {
        await createItem.mutateAsync(payload)
        pushToast(t('admin.recordCreated'))
      }
      closeEditor()
    } catch (error) {
      const details = Array.isArray(error?.details) ? error.details : []
      setFormError(
        details.length
          ? details.map((detail) => `${detail.field}: ${detail.message}`).join(' · ')
          : error.message,
      )
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    try {
      await deleteItem.mutateAsync(pendingDelete.id)
      pushToast(t('admin.recordDeleted'))
      setPendingDelete(null)
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const togglePublished = async (article) => {
    try {
      const published = article.status !== 'published'
      await updateItem.mutateAsync({ id: article.id, status: published ? 'published' : 'draft' })
      pushToast(published ? 'Article published on the website' : 'Article moved back to drafts')
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const articles = (newsQuery.data || []).filter((article) => {
    if (categoryFilter && article.category !== categoryFilter) return false
    return `${article.title} ${article.excerpt} ${article.author}`
      .toLowerCase()
      .includes(search.toLowerCase())
  })

  return (
    <>
      <AdminPageHeader
        title={t('admin.news.title')}
        subtitle={t('admin.news.subtitle')}
        actions={
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            <Plus size={16} />
            {t('admin.news.new')}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t('admin.search')}
            className="w-full sm:max-w-xs"
          />
          <select
            aria-label={t('admin.form.category')}
            className="input sm:w-56"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">{t('news.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.key} value={category.value}>
                {t(`news.categories.${category.key}`)}
              </option>
            ))}
          </select>
        </div>

        <TableFrame
          isLoading={newsQuery.isLoading}
          error={newsQuery.error}
          onRetry={newsQuery.refetch}
          isEmpty={!articles.length}
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={openCreate}>
              <Plus size={16} />
              {t('admin.news.new')}
            </button>
          }
        >
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.news.columns.article')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.news.columns.category')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.news.columns.author')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.news.columns.published')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.news.columns.featured')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-hover/40">
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 max-w-md font-semibold text-white">{article.title}</p>
                    <p className="mt-0.5 line-clamp-1 max-w-md text-[10px] text-muted">
                      {article.excerpt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {t(`news.categories.${categoryKey(article.category)}`)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{article.author}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', article.status === 'published' ? 'bg-positive/10 text-positive' : 'bg-surface2 text-muted')}>
                      {article.status || 'draft'}
                    </span>
                    <span className="mt-1 block">{formatDateTime(article.publishedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        article.featured
                          ? 'bg-accent/12 text-accent'
                          : 'bg-surface2 text-muted',
                      )}
                    >
                      {article.featured
                        ? t('admin.news.featuredYes')
                        : t('admin.news.featuredNo')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => togglePublished(article)}
                        aria-label={article.status === 'published' ? 'Move article to drafts' : 'Publish article'}
                        title={article.status === 'published' ? 'Move to drafts' : 'Publish on website'}
                        className={cn('rounded p-2', article.status === 'published' ? 'text-muted hover:bg-hover hover:text-white' : 'text-positive hover:bg-positive/10')}
                      >
                        {article.status === 'published' ? <EyeOff size={15} /> : <Send size={15} />}
                      </button>
                      <Link
                        to={`/news/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('admin.news.view')}
                        title={t('admin.news.view')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <ExternalLink size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(article)}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(article)}
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>

      {editor ? (
        <NewsForm
          key={editor.id || 'new'}
          initial={editor}
          onSubmit={save}
          onClose={closeEditor}
          isPending={createItem.isPending || updateItem.isPending}
          error={formError}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        isPending={deleteItem.isPending}
        title={pendingDelete?.title}
      />
    </>
  )
}
