import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

function pageWindow(page, totalPages) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}

export default function Pagination({ page, totalPages, onChange, className }) {
  const { t } = useI18n()
  if (!totalPages || totalPages <= 1) return null
  const pages = pageWindow(page, totalPages)

  return (
    <nav aria-label={t('common.page')} className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('common.previous')}
        className="btn btn-ghost px-2.5 py-2"
      >
        <ChevronLeft size={16} />
      </button>
      {pages[0] > 1 ? <span className="px-1 text-xs text-muted">…</span> : null}
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-current={value === page ? 'page' : undefined}
          className={cn(
            'h-8 min-w-8 rounded-md px-2 text-xs font-bold transition-colors',
            value === page
              ? 'bg-accent text-ink'
              : 'border border-line bg-surface text-muted hover:text-white',
          )}
        >
          {value}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages ? (
        <span className="px-1 text-xs text-muted">…</span>
      ) : null}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('common.next')}
        className="btn btn-ghost px-2.5 py-2"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
