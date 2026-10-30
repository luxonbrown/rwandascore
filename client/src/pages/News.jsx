import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import SearchField from '../components/ui/SearchField'
import ArticleCard from '../components/news/ArticleCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { ArticleGridSkeleton } from '../components/ui/Skeletons'
import { useNews } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../utils/cn'

const categories = [
  { key: 'all', label: 'news.allCategories', value: 'All' },
  { key: 'rpl', label: 'news.categories.rpl', value: 'Rwanda Premier League' },
  { key: 'peace-cup', label: 'news.categories.peace-cup', value: 'Peace Cup' },
  { key: 'amavubi', label: 'news.categories.amavubi', value: 'Amavubi' },
  { key: 'grassroots', label: 'news.categories.grassroots', value: 'Grassroots' },
  { key: 'transfers', label: 'news.categories.transfers', value: 'Transfers' },
  { key: 'analysis', label: 'news.categories.analysis', value: 'Analysis' },
]

export default function News() {
  const { t } = useI18n()
  useDocumentTitle(t('news.title'))
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const newsQuery = useNews({
    ...(category !== 'All' ? { category } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  })
  const articles = newsQuery.data || []
  const isFiltered = category !== 'All' || Boolean(debouncedSearch.trim())
  const featured = !isFiltered ? articles.find((article) => article.featured) || articles[0] : null
  const rest = featured ? articles.filter((article) => article.id !== featured.id) : articles

  return (
    <>
      <PageHeader
        eyebrow={t('home.fromNewsroom')}
        title={t('news.title')}
        subtitle={t('news.subtitle')}
        actions={<SearchField value={search} onChange={setSearch} placeholder={t('news.searchPlaceholder')} className="w-full sm:w-72" />}
      >
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={category === item.value}
              className={cn('pill', category === item.value ? 'pill-active' : 'pill-idle')}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </PageHeader>

      <Container className="py-7">
        {newsQuery.isLoading ? (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="skeleton min-h-[340px] rounded-card" />
            <ArticleGridSkeleton count={2} className="grid-cols-1" />
          </div>
        ) : newsQuery.isError ? (
          <ErrorState error={newsQuery.error} onRetry={newsQuery.refetch} />
        ) : articles.length ? (
          <>
            {featured ? (
              <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
                <ArticleCard article={featured} variant="featured" />
                <div className="card divide-y divide-line overflow-hidden">
                  {rest.slice(0, 4).map((article) => (
                    <ArticleCard key={article.id} article={article} variant="compact" className="m-1.5" />
                  ))}
                  {!rest.length ? <EmptyState title={t('news.noArticles')} className="border-0" /> : null}
                </div>
              </div>
            ) : null}

            <section className={featured ? 'mt-8' : ''}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title">
                  {featured ? t('news.latest') : t('news.title')}
                </h2>
                <span className="text-[11px] text-muted">
                  {articles.length} {t('news.title').toLowerCase()}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(featured ? rest.slice(4) : rest).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {featured && rest.length > 4 ? null : null}
            </section>

            {!featured && articles.length ? (
              <p className="mt-6 text-center text-xs text-muted">
                <Link to="/news" className="font-semibold text-accent">
                  {t('news.latest')}
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={Newspaper}
            title={t('news.noArticles')}
            body={isFiltered ? t('news.noArticlesBody') : 'No published stories are available yet. Publish an article from Admin → News to show it here.'}
            action={
              <button
                type="button"
                onClick={() => {
                  setCategory('All')
                  setSearch('')
                }}
                className="btn btn-secondary"
              >
                {t('common.clearFilters')}
              </button>
            }
          />
        )}
      </Container>
    </>
  )
}
