import { Link } from 'react-router-dom'
import { Clock3, ImageOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../hooks/useI18n'
import { formatTimeAgo, readMinutes } from '../../utils/format'

function ArticleImage({ article, className }) {
  const [failed, setFailed] = useState(false)
  if (failed || !article.image) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-pitch via-surface2 to-surface text-white/20',
          className,
        )}
      >
        <ImageOff size={24} />
      </div>
    )
  }
  return (
    <img
      src={article.image}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('object-cover transition-transform duration-500 group-hover:scale-[1.03]', className)}
    />
  )
}

export default function ArticleCard({ article, variant = 'standard', className }) {
  const { t } = useI18n()
  const meta = `${formatTimeAgo(article.publishedAt, t)} · ${t('news.minRead', {
    count: readMinutes(article.body),
  })}`

  if (variant === 'compact') {
    return (
      <Link
        to={`/news/${article.slug}`}
        className={cn('group flex gap-3 rounded-lg p-2 transition-colors hover:bg-hover', className)}
      >
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-surface2">
          <ArticleImage article={article} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-accent">{article.category}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-accent">
            {article.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted">{meta}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        to={`/news/${article.slug}`}
        className={cn(
          'group relative block min-h-[340px] overflow-hidden rounded-card border border-line',
          className,
        )}
      >
        <ArticleImage
          article={article}
          className="absolute inset-0 h-full w-full opacity-80 group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="relative flex h-full min-h-[340px] flex-col justify-end p-5 sm:p-7">
          <span className="mb-2 w-fit rounded-sm bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink">
            {article.featured ? t('news.featured') : article.category}
          </span>
          <h2 className="max-w-2xl text-xl font-extrabold leading-tight text-white sm:text-2xl">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/70">{article.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
            <span className="font-semibold text-white/80">{article.source}</span>
            <span>·</span>
            <span>{meta}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/news/${article.slug}`}
      className={cn(
        'card group flex h-full flex-col overflow-hidden transition-colors hover:border-white/15',
        className,
      )}
    >
      <div className="aspect-[16/9] overflow-hidden bg-surface2">
        <ArticleImage article={article} className="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{article.category}</p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-white group-hover:text-accent">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{article.excerpt}</p>
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] text-muted">
          <Clock3 size={12} />
          <span>{meta}</span>
        </div>
      </div>
    </Link>
  )
}
