import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import FormModal from '../../components/admin/FormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import { useAdminCollection, useCreateAdminItem, useDeleteAdminItem, useUpdateAdminItem } from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { siteConfig } from '../../config'

const types = ['league', 'cup', 'national']

const emptyForm = {
  name: '',
  shortName: '',
  type: 'league',
  season: siteConfig.season,
  country: 'Rwanda',
  logoText: '',
  color: '#FF6B00',
  secondaryColor: '#121212',
  teamCount: 16,
  description: '',
}

function CompetitionForm({ initial, onSubmit, onClose, isPending, error }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <FormModal
      open
      onClose={onClose}
      title={initial.id ? t('common.edit') : t('admin.competitions.new')}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
      isPending={isPending}
      error={error}
      submitLabel={initial.id ? t('admin.save') : t('admin.create')}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="comp-name" className="label">
            {t('admin.form.name')} *
          </label>
          <input
            id="comp-name"
            className="input"
            required
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-short" className="label">
            {t('admin.form.shortName')}
          </label>
          <input
            id="comp-short"
            className="input"
            value={form.shortName}
            onChange={(event) => set('shortName', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-type" className="label">
            {t('admin.form.type')}
          </label>
          <select
            id="comp-type"
            className="input"
            value={form.type}
            onChange={(event) => set('type', event.target.value)}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {t(`competitions.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="comp-season" className="label">
            {t('admin.form.season')}
          </label>
          <input
            id="comp-season"
            className="input"
            value={form.season}
            onChange={(event) => set('season', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-country" className="label">
            {t('admin.form.country')}
          </label>
          <input
            id="comp-country"
            className="input"
            value={form.country}
            onChange={(event) => set('country', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-logo-text" className="label">
            {t('admin.form.logoText')}
          </label>
          <input
            id="comp-logo-text"
            className="input uppercase"
            maxLength={4}
            value={form.logoText}
            onChange={(event) => set('logoText', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-team-count" className="label">
            {t('admin.form.teamCount')}
          </label>
          <input
            id="comp-team-count"
            type="number"
            min="0"
            className="input"
            value={form.teamCount}
            onChange={(event) => set('teamCount', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="comp-color" className="label">
            {t('admin.form.primaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="comp-color"
              type="color"
              aria-label={t('admin.form.primaryColor')}
              className="h-10 w-12 cursor-pointer rounded border border-line bg-surface2 p-1"
              value={form.color}
              onChange={(event) => set('color', event.target.value)}
            />
            <input
              className="input uppercase"
              value={form.color}
              onChange={(event) => set('color', event.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="comp-color-2" className="label">
            {t('admin.form.secondaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="comp-color-2"
              type="color"
              aria-label={t('admin.form.secondaryColor')}
              className="h-10 w-12 cursor-pointer rounded border border-line bg-surface2 p-1"
              value={form.secondaryColor}
              onChange={(event) => set('secondaryColor', event.target.value)}
            />
            <input
              className="input uppercase"
              value={form.secondaryColor}
              onChange={(event) => set('secondaryColor', event.target.value)}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="comp-description" className="label">
            {t('admin.form.description')}
          </label>
          <textarea
            id="comp-description"
            className="input min-h-24"
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  )
}

export default function AdminCompetitions() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.competitions.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const pushToast = useUiStore((state) => state.pushToast)
  const listQuery = useAdminCollection('competitions')
  const createItem = useCreateAdminItem('competitions')
  const updateItem = useUpdateAdminItem('competitions')
  const deleteItem = useDeleteAdminItem('competitions')
  const [editor, setEditor] = useState(() =>
    searchParams.get('new') === '1' ? { ...emptyForm } : null,
  )
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
    if (searchParams.get('new')) setSearchParams({}, { replace: true })
  }

  const openCreate = () => {
    setFormError('')
    setEditor({ ...emptyForm })
  }

  const openEdit = (competition) => {
    setFormError('')
    setEditor({
      ...emptyForm,
      ...competition,
      teamCount: competition.teamCount || 0,
    })
  }

  const save = async (form) => {
    setFormError('')
    try {
      if (form.id) {
        await updateItem.mutateAsync({ id: form.id, ...form })
        pushToast(t('admin.recordSaved'))
      } else {
        await createItem.mutateAsync(form)
        pushToast(t('admin.recordCreated'))
      }
      closeEditor()
    } catch (error) {
      setFormError(error.message)
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    try {
      await deleteItem.mutateAsync(pendingDelete.id)
      pushToast(t('admin.recordDeleted'))
      setPendingDelete(null)
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const competitions = listQuery.data || []

  return (
    <>
      <AdminPageHeader
        title={t('admin.competitions.title')}
        subtitle={t('admin.competitions.subtitle')}
        actions={
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            <Plus size={16} />
            {t('admin.competitions.new')}
          </button>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <TableFrame
          isLoading={listQuery.isLoading}
          error={listQuery.error}
          onRetry={listQuery.refetch}
          isEmpty={!competitions.length}
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={openCreate}>
              <Plus size={16} />
              {t('admin.competitions.new')}
            </button>
          }
        >
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.competitions.columns.competition')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.competitions.columns.type')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.competitions.columns.season')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.competitions.columns.teams')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {competitions.map((competition) => (
                <tr key={competition.id} className="hover:bg-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                        style={{ backgroundColor: competition.color || '#FF6B00' }}
                      >
                        {competition.logoText || competition.name.slice(0, 3)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{competition.name}</p>
                        <p className="truncate text-[10px] text-muted">{competition.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {t(`competitions.${competition.type || 'league'}`)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{competition.season}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-white">
                    {competition.teamCount || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(competition)}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(competition)}
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>

      {editor ? (
        <CompetitionForm
          key={editor.id || 'new'}
          initial={editor}
          onSubmit={save}
          isPending={createItem.isPending || updateItem.isPending}
          error={formError}
          onClose={closeEditor}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        isPending={deleteItem.isPending}
        title={pendingDelete?.name}
        warning={t('admin.deleteCompetitionWarning')}
      />
    </>
  )
}
