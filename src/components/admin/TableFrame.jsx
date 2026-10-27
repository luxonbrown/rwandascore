import { RefreshCw } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import ErrorState from '../ui/ErrorState'
import EmptyState from '../ui/EmptyState'

export default function TableFrame({
  children,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyBody,
  emptyAction,
  footer,
}) {
  const { t } = useI18n()

  return (
    <div className="card overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-muted">
          <RefreshCw size={16} className="animate-spin" />
          {t('admin.loading')}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : isEmpty ? (
        <EmptyState
          title={emptyTitle || t('admin.noRecords')}
          body={emptyBody || t('admin.noRecordsBody')}
          action={emptyAction}
          className="border-0 bg-transparent"
        />
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
      {footer && !isLoading && !error && !isEmpty ? (
        <div className="border-t border-line px-4 py-3">{footer}</div>
      ) : null}
    </div>
  )
}
