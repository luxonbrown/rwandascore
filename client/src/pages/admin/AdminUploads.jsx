import { useEffect, useRef, useState } from 'react'
import { Copy, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import EmptyState from '../../components/ui/EmptyState'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { formatDateTime } from '../../utils/format'

const STORAGE_KEY = 'rwandascore_uploads_v1'
const MAX_BYTES = 1.5 * 1024 * 1024
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

function readLibrary() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLibrary(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export default function AdminUploads() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.uploads.title'))
  const pushToast = useUiStore((state) => state.pushToast)
  const [items, setItems] = useState(readLibrary)
  const [dragging, setDragging] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [copiedId, setCopiedId] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setItems(readLibrary())
  }, [])

  const persist = (next) => {
    try {
      writeLibrary(next)
      setItems(next)
      return true
    } catch {
      pushToast(t('admin.uploads.storageFull'), 'error')
      return false
    }
  }

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    const accepted = []
    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) {
        pushToast(t('admin.uploads.imagesOnly'), 'error')
        continue
      }
      if (file.size > MAX_BYTES) {
        pushToast(t('admin.uploads.tooLarge'), 'error')
        continue
      }
      const url = await readFile(file)
      accepted.push({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        createdAt: new Date().toISOString(),
      })
    }
    if (!accepted.length) return
    if (persist([...accepted, ...items])) {
      pushToast(t('admin.uploads.uploaded'))
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const copy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopiedId(item.id)
      pushToast(t('admin.uploads.copied'))
      setTimeout(() => setCopiedId(''), 1600)
    } catch {
      pushToast(t('admin.uploads.copyFailed'), 'error')
    }
  }

  const remove = () => {
    if (!pendingDelete) return
    if (persist(items.filter((item) => item.id !== pendingDelete.id))) {
      pushToast(t('admin.recordDeleted'))
    }
    setPendingDelete(null)
  }

  return (
    <>
      <AdminPageHeader
        title={t('admin.uploads.title')}
        subtitle={t('admin.uploads.subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={16} />
            {t('admin.uploads.browse')}
          </button>
        }
      />
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="sr-only"
          aria-label={t('admin.uploads.browse')}
          onChange={(event) => addFiles(event.target.files)}
        />

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFiles(event.dataTransfer.files)
          }}
          className={`card flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-12 text-center transition ${
            dragging ? 'border-accent bg-accent/5' : 'border-line'
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/12 text-accent">
            <UploadCloud size={22} />
          </span>
          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm font-semibold text-white hover:text-accent"
            >
              {t('admin.uploads.dropzone')}
            </button>
            <p className="mt-1 text-[11px] text-muted">{t('admin.uploads.note')}</p>
          </div>
        </div>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 className="section-title">{t('admin.uploads.library')}</h2>
            <span className="text-[11px] font-semibold text-muted">{items.length}</span>
          </div>
          {items.length ? (
            <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-lg border border-line bg-surface2/40">
                  <div className="flex aspect-video items-center justify-center overflow-hidden bg-pitch/40">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-xs font-semibold text-white" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted">
                      {formatBytes(item.size)} · {formatDateTime(item.createdAt)}
                    </p>
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => copy(item)}
                        className="btn btn-secondary flex-1 px-2 py-1.5 text-[11px]"
                      >
                        <Copy size={13} />
                        {copiedId === item.id ? t('admin.uploads.copied') : t('admin.uploads.copy')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        aria-label={t('admin.uploads.delete')}
                        title={t('admin.uploads.delete')}
                        className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ImagePlus}
              title={t('admin.uploads.noFiles')}
              body={t('admin.uploads.noFilesBody')}
              action={
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => inputRef.current?.click()}
                >
                  {t('admin.uploads.browse')}
                </button>
              }
            />
          )}
        </section>
      </div>

      <ConfirmDeleteModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        title={pendingDelete?.name}
        warning={t('admin.uploads.note')}
      />
    </>
  )
}
