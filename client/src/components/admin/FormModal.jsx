import { useId } from 'react'
import { Loader2, Save } from 'lucide-react'
import Modal from '../ui/Modal'
import { useI18n } from '../../hooks/useI18n'

export default function FormModal({
  open,
  onClose,
  title,
  description,
  size = 'lg',
  onSubmit,
  isPending,
  error,
  submitLabel,
  children,
}) {
  const { t } = useI18n()
  const formId = useId()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      title={title}
      description={description}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form={formId} className="btn btn-accent" disabled={isPending}>
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isPending ? t('admin.saving') : submitLabel || t('admin.save')}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-negative/25 bg-negative/10 px-3 py-2 text-xs font-medium text-negative"
          >
            {error}
          </p>
        ) : null}
        {children}
      </form>
    </Modal>
  )
}
