import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import EmptyState from './EmptyState'

export default function ErrorState({ error, onRetry, title, body }) {
  const { t } = useI18n()
  const notFound = error?.status === 404
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title || (notFound ? t('errors.notFoundTitle') : t('common.error'))}
      body={body || (notFound ? t('errors.notFoundBody') : t('common.errorBody'))}
      action={
        onRetry ? (
          <button type="button" onClick={onRetry} className="btn btn-secondary">
            <RefreshCw size={15} />
            {t('common.retry')}
          </button>
        ) : null
      }
    />
  )
}
