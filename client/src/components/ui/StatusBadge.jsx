import { cn } from '../../utils/cn'
import { useI18n } from '../../hooks/useI18n'
import { isLiveStatus, statusKey } from '../../utils/media'

export default function StatusBadge({ status, minute, className, showMinute = false }) {
  const { t } = useI18n()
  const live = isLiveStatus(status)

  if (status === 'UPCOMING') {
    return <span className={cn('text-[11px] font-bold text-muted', className)}>{t('common.upcoming')}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide',
        live ? 'text-accent' : 'text-muted',
        className,
      )}
    >
      {live ? <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" /> : null}
      {t(statusKey(status))}
      {showMinute && live && minute ? (
        <span className="tabular-nums">
          {t('live.minute', { minute })}
        </span>
      ) : null}
    </span>
  )
}
