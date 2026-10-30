import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import FormModal from '../../components/admin/FormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import SearchField from '../../components/ui/SearchField'
import TeamCrest from '../../components/ui/TeamCrest'
import {
  useAdminCollection,
  useCreateAdminItem,
  useDeleteAdminItem,
  useUpdateAdminItem,
} from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { describeApiError } from '../../services/api'
import { cn } from '../../utils/cn'

const emptyForm = {
  name: '',
  shortName: '',
  initials: '',
  city: '',
  stadium: '',
  stadiumId: '',
  founded: '',
  nickname: '',
  coachName: '',
  coachNationality: 'Rwanda',
  primaryColor: '#FF6B00',
  secondaryColor: '#121212',
  competitionIds: ['rwanda-premier-league'],
  national: false,
  description: '',
  logo: '',
}

function teamToForm(team) {
  return {
    ...emptyForm,
    ...team,
    coachName: team.coach?.name || (typeof team.coach === 'string' ? team.coach : ''),
    coachNationality: team.coach?.nationality || 'Rwanda',
    primaryColor: team.primaryColor || team.colors?.primary || '#FF6B00',
    secondaryColor: team.secondaryColor || team.colors?.secondary || '#121212',
    founded: team.founded ?? '',
    stadium: team.stadium || '',
    stadiumId: team.stadiumId || '',
    logo: team.logoUrl || team.logo || '',
    competitionIds: team.competitionIds || [],
    national: team.isNational ?? team.national ?? false,
  }
}

function TeamForm({ initial, competitions, onSubmit, onClose, isPending, error }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const toggleCompetition = (id) => {
    setForm((current) => ({
      ...current,
      competitionIds: current.competitionIds.includes(id)
        ? current.competitionIds.filter((value) => value !== id)
        : [...current.competitionIds, id],
    }))
  }

  return (
    <FormModal
      open
      onClose={onClose}
      title={initial.id ? t('common.edit') : t('admin.teams.new')}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
      isPending={isPending}
      error={error}
      submitLabel={initial.id ? t('admin.save') : t('admin.create')}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="team-name" className="label">
            {t('admin.form.name')} *
          </label>
          <input
            id="team-name"
            className="input"
            required
            minLength={2}
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-short" className="label">
            {t('admin.form.shortName')}
          </label>
          <input
            id="team-short"
            className="input"
            required
            minLength={2}
            value={form.shortName}
            onChange={(event) => set('shortName', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-initials" className="label">
            {t('admin.form.initials')}
          </label>
          <input
            id="team-initials"
            className="input uppercase"
            required
            maxLength={3}
            value={form.initials}
            onChange={(event) => set('initials', event.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label htmlFor="team-founded" className="label">
            {t('admin.form.founded')}
          </label>
          <input
            id="team-founded"
            type="number"
            min="1900"
            max="2100"
            className="input"
            value={form.founded}
            onChange={(event) => set('founded', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-city" className="label">
            {t('admin.form.city')}
          </label>
          <input
            id="team-city"
            className="input"
            required
            value={form.city}
            onChange={(event) => set('city', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-stadium" className="label">
            {t('admin.form.stadium')}
          </label>
          <input
            id="team-stadium"
            className="input"
            value={form.stadium}
            onChange={(event) => set('stadium', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-nickname" className="label">
            {t('admin.form.nickname')}
          </label>
          <input
            id="team-nickname"
            className="input"
            value={form.nickname}
            onChange={(event) => set('nickname', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-coach" className="label">
            {t('admin.form.coachName')}
          </label>
          <input
            id="team-coach"
            className="input"
            value={form.coachName}
            onChange={(event) => set('coachName', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-coach-nationality" className="label">
            {t('admin.form.coachNationality')}
          </label>
          <input
            id="team-coach-nationality"
            className="input"
            value={form.coachNationality}
            onChange={(event) => set('coachNationality', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="team-logo" className="label">
            {t('admin.form.logoUrl')}
          </label>
          <input
            id="team-logo"
            type="url"
            className="input"
            placeholder="https://…"
            value={form.logo}
            onChange={(event) => set('logo', event.target.value)}
          />
          <Link to="/admin/uploads" className="mt-1 inline-block text-[11px] font-semibold text-accent hover:underline">
            {t('admin.form.uploadLogo')}
          </Link>
        </div>
        <div>
          <label htmlFor="team-primary" className="label">
            {t('admin.form.primaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="team-primary"
              type="color"
              aria-label={t('admin.form.primaryColor')}
              className="h-10 w-12 cursor-pointer rounded border border-line bg-surface2 p-1"
              value={form.primaryColor}
              onChange={(event) => set('primaryColor', event.target.value)}
            />
            <input
              className="input uppercase"
              required
              pattern="#[0-9a-fA-F]{6}"
              value={form.primaryColor}
              onChange={(event) => set('primaryColor', event.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="team-secondary" className="label">
            {t('admin.form.secondaryColor')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="team-secondary"
              type="color"
              aria-label={t('admin.form.secondaryColor')}
              className="h-10 w-12 cursor-pointer rounded border border-line bg-surface2 p-1"
              value={form.secondaryColor}
              onChange={(event) => set('secondaryColor', event.target.value)}
            />
            <input
              className="input uppercase"
              required
              pattern="#[0-9a-fA-F]{6}"
              value={form.secondaryColor}
              onChange={(event) => set('secondaryColor', event.target.value)}
            />
          </div>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="label">{t('admin.form.competitions')}</legend>
          <div className="flex flex-wrap gap-2">
            {competitions.map((competition) => {
              const active = form.competitionIds.includes(competition.id)
              return (
                <label
                  key={competition.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                    active
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-line bg-surface2 text-muted hover:text-white',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => toggleCompetition(competition.id)}
                  />
                  {competition.shortName || competition.name}
                </label>
              )
            })}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-xs font-semibold text-white sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.national)}
            onChange={(event) => set('national', event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t('admin.form.national')}
        </label>
        <div className="sm:col-span-2">
          <label htmlFor="team-description" className="label">
            {t('admin.form.description')}
          </label>
          <textarea
            id="team-description"
            className="input min-h-24"
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  )
}

export default function AdminTeams() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.teams.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const pushToast = useUiStore((state) => state.pushToast)
  const teamsQuery = useAdminCollection('teams')
  const competitionsQuery = useAdminCollection('competitions')
  const createItem = useCreateAdminItem('teams')
  const updateItem = useUpdateAdminItem('teams')
  const deleteItem = useDeleteAdminItem('teams')
  const [editor, setEditor] = useState(() =>
    searchParams.get('new') === '1' ? { ...emptyForm } : null,
  )
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
    if (searchParams.get('new')) setSearchParams({}, { replace: true })
  }

  const openCreate = () => {
    setFormError('')
    setEditor({ ...emptyForm })
  }

  const openEdit = (team) => {
    setFormError('')
    setEditor(teamToForm(team))
  }

  const save = async (form) => {
    setFormError('')
    const payload = {
      name: form.name,
      shortName: form.shortName,
      initials: form.initials,
      city: form.city,
      stadium: form.stadium,
      stadiumId: form.stadiumId,
      founded: form.founded,
      nickname: form.nickname,
      coach: { name: form.coachName, nationality: form.coachNationality },
      colors: { primary: form.primaryColor, secondary: form.secondaryColor },
      competitionIds: form.competitionIds,
      national: form.national,
      description: form.description,
      logo: form.logo,
    }
    try {
      if (form.id) {
        await updateItem.mutateAsync({ id: form.id, ...payload })
        pushToast(t('admin.recordSaved'))
      } else {
        await createItem.mutateAsync(payload)
        pushToast(t('admin.recordCreated'))
      }
      closeEditor()
    } catch (error) {
      setFormError(describeApiError(error))
    }
  }

  const remove = async () => {
    if (!pendingDelete) return
    try {
      await deleteItem.mutateAsync(pendingDelete.id)
      pushToast(t('admin.recordDeleted'))
      setPendingDelete(null)
    } catch (error) {
      pushToast(describeApiError(error), 'error')
    }
  }

  const teams = (teamsQuery.data || []).filter((team) =>
    `${team.name} ${team.city} ${team.nickname}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <AdminPageHeader
        title={t('admin.teams.title')}
        subtitle={t('admin.teams.subtitle')}
        actions={
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            <Plus size={16} />
            {t('admin.teams.new')}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder={t('admin.search')}
          className="w-full sm:max-w-sm"
        />
        <TableFrame
          isLoading={teamsQuery.isLoading}
          error={teamsQuery.error}
          onRetry={teamsQuery.refetch}
          isEmpty={!teams.length}
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={openCreate}>
              <Plus size={16} />
              {t('admin.teams.new')}
            </button>
          }
        >
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.teams.columns.team')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.teams.columns.city')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.teams.columns.stadium')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.teams.columns.coach')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TeamCrest team={team} size="sm" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-white">
                          {team.name}
                          {team.national ? <Flag size={12} className="text-accent" /> : null}
                        </p>
                        <p className="truncate text-[10px] text-muted">{team.nickname || team.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{team.city || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">{team.stadium || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {(typeof team.coach === 'string' ? team.coach : team.coach?.name) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(team)}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(team)}
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
        <TeamForm
          key={editor.id || 'new'}
          initial={editor}
          competitions={competitionsQuery.data || []}
          onSubmit={save}
          onClose={closeEditor}
          isPending={createItem.isPending || updateItem.isPending}
          error={formError}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        isPending={deleteItem.isPending}
        title={pendingDelete?.name}
        warning={t('admin.deleteTeamWarning')}
      />
    </>
  )
}
