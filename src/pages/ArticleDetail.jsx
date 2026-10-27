import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock3, ImageOff, UserRound } from 'lucide-react'
import { useState } from 'react'
import Container from '../components/ui/Container'
import ArticleCard from '../components/news/ArticleCard'
import ShareButton from '../components/ui/ShareButton'
import ErrorState from '../components/ui/ErrorState'
import { useArticle } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { formatDateLong, readMinutes } from '../utils/format'

function HeroImage({ article }) {
  const [failed, setFailed] = useState(false)
  if (!article.image || failed) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center rounded-card border border-line bg-gradient-to-br from-pitch via-surface2 to-surface text-white/20">
        <ImageOff size={32} />
      </div>
    )
  }
  return (
    <img
      src={article.image}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="max-h-[460px] w-full rounded-card border border-line object-cover"
    />
  )
}

export default function ArticleDetail() {
  const { slug } = useParams()
  const { t } = useI18n()
  const query = useArticle(slug)
  useDocumentTitle(query.data?.article?.title)

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <div className="skeleton mb-5 h-4 w-32" />
        <div className="skeleton mb-4 h-10 w-3/4" />
        <div className="skeleton mb-7 h-4 w-1/2" />
        <div className="skeleton h-80 w-full rounded-card" />
      </Container>
    )
  }
  if (query.isError) {
    return (
      <Container className="py-10">
        <ErrorState error={query.error} onRetry={query.refetch} />
      </Container>
    )
  }

  const { article, related } = query.data

  return (
    <>
      <Container className="py-7">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white"
        >
          <ArrowLeft size={14} />
          {t('news.backToNews')}
        </Link>

        <div className="mx-auto mt-5 max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{article.category}</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65">{article.excerpt}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-muted">
                <UserRound size={17} />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">{article.author}</p>
                <p className="text-[11px] text-muted">
                  {article.source} · {formatDateLong(article.publishedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                <Clock3 size={12} />
                {t('news.minRead', { count: readMinutes(article.body) })}
              </span>
              <ShareButton title={article.title} text={article.excerpt} />
            </div>
          </div>

          <div className="mt-6">
            <HeroImage article={article} />
          </div>

          <div className="mt-7 space-y-5 text-[15px] leading-[1.85] text-white/80">
            {article.body.map((paragraph, index) => (
              <p key={index} className={index === 0 ? 'text-base text-white/90' : undefined}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-white">{t('news.shareStory')}</p>
            <ShareButton title={article.title} text={article.excerpt} label={t('news.shareStory')} />
          </div>
        </div>
      </Container>

      {related.length ? (
        <section className="border-t border-line bg-surface/25 py-8">
          <Container>
            <h2 className="section-title mb-4">{t('news.moreFrom', { category: article.category })}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
