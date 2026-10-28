import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { useI18n } from '../../hooks/useI18n'

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  isPending,
}) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title || t('admin.confirmDelete')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isPending}
          >
            <Trash2 size={15} />
            {isPending ? t('admin.deleting') : t('admin.delete')}
          </button>
        </>
      }
    >
      <div className="flex gap-3 rounded-lg border border-negative/20 bg-negative/5 p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-negative" />
        <p className="text-sm leading-relaxed text-muted">
          {description || t('admin.deleteWarning')}
          {warning ? <span className="mt-2 block text-negative">{warning}</span> : null}
        </p>
      </div>
    </Modal>
  )
}
