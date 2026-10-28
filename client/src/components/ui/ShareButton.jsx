import { Share2 } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { useUiStore } from '../../store/ui'
import { cn } from '../../utils/cn'

export default function ShareButton({ title, text, className, label }) {
  const { t } = useI18n()
  const pushToast = useUiStore((state) => state.pushToast)

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      pushToast(t('common.copied'), 'success')
    } catch (error) {
      if (error?.name !== 'AbortError') pushToast(t('common.copyLink'), 'error')
    }
  }

  return (
    <button type="button" onClick={handleShare} className={cn('btn btn-secondary', className)}>
      <Share2 size={15} />
      {label || t('common.share')}
    </button>
  )
}
