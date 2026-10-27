import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '../../store/ui'
import { cn } from '../../utils/cn'

const tones = {
  success: { icon: CheckCircle2, className: 'border-positive/30 bg-positive/10 text-positive' },
  error: { icon: AlertCircle, className: 'border-negative/30 bg-negative/10 text-negative' },
  info: { icon: Info, className: 'border-info/30 bg-info/10 text-info' },
}

function Toast({ toast, onDismiss }) {
  const tone = tones[toast.type] || tones.success
  const Icon = tone.icon

  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.id), 3800)
    return () => clearTimeout(timeout)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lift animate-fade-in',
        tone.className,
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1 text-white">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 text-muted hover:text-white"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useUiStore((state) => state.toasts)
  const dismissToast = useUiStore((state) => state.dismissToast)

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col items-center gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
          <Toast toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  )
}
