import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Radio, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import FormModal from '../../components/admin/FormModal'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import SearchField from '../../components/ui/SearchField'
import TeamCrest from '../../components/ui/TeamCrest'
import StatusBadge from '../../components/ui/StatusBadge'
import {
  useAdminCollection,
  useCreateAdminItem,
  useDeleteAdminItem,
  useUpdateAdminItem,
} from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { formatDate, formatTime, toDateTimeInput } from '../../utils/format'
import { isLiveStatus, statusKey } from '../../utils/media'

const statuses = ['UPCOMING', 'LIVE', 'HT', 'FT', 'POSTPONED']

function defaultForm() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setHours(15, 30, 0, 0)
  return {
    competitionId: '',
    round: 'Matchday',
    homeTeamId: '',
    awayTeamId: '',
    kicksOff: toDateTimeInput(date),
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    venue: '',
    city: '',
    referee: '',
    attendance: '',
  }
}

function fixtureToForm(match) {
  return {
    competitionId: match.competitionId || '',
    round: match.round || 'Matchday',
    homeTeamId: match.homeTeamId || '',
    awayTeamId: match.awayTeamId || '',
    kicksOff: toDateTimeInput(match.date),
    status: match.status || 'UPCOMING',
    homeScore: match.homeScore ?? 0,
    awayScore: match.awayScore ?? 0,
    minute: match.minute ?? 0,
    venue: match.venue || '',
    city: match.city || '',
    referee: match.referee || '',
    attendance: match.attendance ?? '',
  }
}

function FixtureForm({ initial, teams, competitions, onSubmit, onClose, isPending, error }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <FormModal
      open
      onClose={onClose}
      title={initial.id ? t('admin.fixtures.editTitle') : t('admin.fixtures.new')}
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
          <label htmlFor="fixture-competition" className="label">
            {t('admin.form.competition')} *
          </label>
          <select
            id="fixture-competition"
            className="input"
            required
            value={form.competitionId}
            onChange={(event) => set('competitionId', event.target.value)}
          >
            <option value="">{t('admin.form.selectPlaceholder')}</option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fixture-round" className="label">
            {t('admin.form.round')}
          </label>
          <input
            id="fixture-round"
            className="input"
            value={form.round}
            onChange={(event) => set('round', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fixture-home" className="label">
            {t('admin.form.homeTeam')} *
          </label>
          <select
            id="fixture-home"
            className="input"
            required
            value={form.homeTeamId}
            onChange={(event) => set('homeTeamId', event.target.value)}
          >
            <option value="">{t('admin.form.selectPlaceholder')}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fixture-away" className="label">
            {t('admin.form.awayTeam')} *
          </label>
          <select
            id="fixture-away"
            className="input"
            required
            value={form.awayTeamId}
            onChange={(event) => set('awayTeamId', event.target.value)}
          >
            <option value="">{t('admin.form.selectPlaceholder')}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fixture-kickoff" className="label">
            {t('admin.form.kicksOff')} *
          </label>
          <input
            id="fixture-kickoff"
            type="datetime-local"
            className="input"
            required
            value={form.kicksOff}
            onChange={(event) => set('kicksOff', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fixture-status" className="label">
            {t('admin.form.status')}
          </label>
          <select
            id="fixture-status"
            className="input"
            value={form.status}
            onChange={(event) => set('status', event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(statusKey(status))}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <div>
            <label htmlFor="fixture-home-score" className="label">
              {t('admin.form.homeScore')}
            </label>
            <input
              id="fixture-home-score"
              type="number"
              min="0"
              className="input"
              value={form.homeScore}
              onChange={(event) => set('homeScore', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fixture-away-score" className="label">
              {t('admin.form.awayScore')}
            </label>
            <input
              id="fixture-away-score"
              type="number"
              min="0"
              className="input"
              value={form.awayScore}
              onChange={(event) => set('awayScore', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fixture-minute" className="label">
              {t('admin.live.minute')}
            </label>
            <input
              id="fixture-minute"
              type="number"
              min="0"
              max="120"
              className="input"
              value={form.minute}
              onChange={(event) => set('minute', event.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="fixture-venue" className="label">
            {t('admin.form.venue')}
          </label>
          <input
            id="fixture-venue"
            className="input"
            value={form.venue}
            onChange={(event) => set('venue', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fixture-city" className="label">
            {t('admin.form.city')}
          </label>
          <input
            id="fixture-city"
            className="input"
            value={form.city}
            onChange={(event) => set('city', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fixture-referee" className="label">
            {t('admin.form.referee')}
          </label>
          <input
            id="fixture-referee"
            className="input"
            value={form.referee}
            onChange={(event) => set('referee', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="fixture-attendance" className="label">
            {t('admin.form.attendance')}
          </label>
          <input
            id="fixture-attendance"
            type="number"
            min="0"
            className="input"
            value={form.attendance}
            onChange={(event) => set('attendance', event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  )
}

export default function AdminFixtures() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.fixtures.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const pushToast = useUiStore((state) => state.pushToast)
  const fixturesQuery = useAdminCollection('fixtures')
  const teamsQuery = useAdminCollection('teams')
  const competitionsQuery = useAdminCollection('competitions')
  const createItem = useCreateAdminItem('fixtures')
  const updateItem = useUpdateAdminItem('fixtures')
  const deleteItem = useDeleteAdminItem('fixtures')
  const [editor, setEditor] = useState(() =>
    searchParams.get('new') === '1' ? defaultForm() : null,
  )
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [competitionFilter, setCompetitionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
    if (searchParams.get('new')) setSearchParams({}, { replace: true })
  }

  const openCreate = () => {
    setFormError('')
    setEditor(defaultForm())
  }

  const openEdit = (match) => {
    setFormError('')
    setEditor({ ...fixtureToForm(match), id: match.id })
  }

  const save = async (form) => {
    setFormError('')
    const { kicksOff, id, ...rest } = form
    const payload = {
      ...rest,
      date: new Date(kicksOff).toISOString(),
      homeScore: Number(form.homeScore || 0),
      awayScore: Number(form.awayScore || 0),
      minute: Number(form.minute || 0),
      attendance: form.attendance === '' ? null : Number(form.attendance),
    }
    try {
      if (id) {
        await updateItem.mutateAsync({ id, ...payload })
        pushToast(t('admin.recordSaved'))
      } else {
        await createItem.mutateAsync(payload)
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

  const competitions = competitionsQuery.data || []
  const teams = teamsQuery.data || []
  const fixtures = (fixturesQuery.data || []).filter((match) => {
    if (competitionFilter && match.competitionId !== competitionFilter) return false
    if (statusFilter && match.status !== statusFilter) return false
    const haystack = `${match.homeTeam?.name} ${match.awayTeam?.name} ${match.venue} ${match.round}`
    return haystack.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <AdminPageHeader
        title={t('admin.fixtures.title')}
        subtitle={t('admin.fixtures.subtitle')}
        actions={
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            <Plus size={16} />
            {t('admin.fixtures.new')}
          </button>
        }
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder={t('admin.search')}
            className="w-full sm:max-w-xs"
          />
          <select
            aria-label={t('admin.fixtures.filterCompetition')}
            className="input sm:w-56"
            value={competitionFilter}
            onChange={(event) => setCompetitionFilter(event.target.value)}
          >
            <option value="">{t('admin.fixtures.filterCompetition')}</option>
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.fixtures.filterStatus')}
            className="input sm:w-44"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">{t('admin.fixtures.filterStatus')}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(statusKey(status))}
              </option>
            ))}
          </select>
        </div>

        <TableFrame
          isLoading={fixturesQuery.isLoading}
          error={fixturesQuery.error}
          onRetry={fixturesQuery.refetch}
          isEmpty={!fixtures.length}
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={openCreate}>
              <Plus size={16} />
              {t('admin.fixtures.new')}
            </button>
          }
        >
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.fixtures.columns.match')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.fixtures.columns.competition')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.fixtures.columns.date')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.fixtures.columns.venue')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.fixtures.columns.status')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fixtures.map((match) => (
                <tr key={match.id} className="hover:bg-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TeamCrest team={match.homeTeam} size="xs" />
                      <span className="max-w-28 truncate text-xs font-semibold text-white">
                        {match.homeTeam?.shortName || match.homeTeam?.name}
                      </span>
                      <span className="text-xs font-extrabold tabular-nums text-accent">
                        {match.homeScore}–{match.awayScore}
                      </span>
                      <span className="max-w-28 truncate text-xs font-semibold text-white">
                        {match.awayTeam?.shortName || match.awayTeam?.name}
                      </span>
                      <TeamCrest team={match.awayTeam} size="xs" />
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">{match.round}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {match.competition?.shortName || match.competition?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <span className="block text-white">{formatDate(match.date)}</span>
                    {formatTime(match.date)}
                  </td>
                  <td className="max-w-36 truncate px-4 py-3 text-xs text-muted">
                    {match.venue || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={match.status} minute={match.minute} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {isLiveStatus(match.status) ? (
                        <Link
                          to="/admin/live"
                          aria-label={t('admin.fixtures.manageLive')}
                          title={t('admin.fixtures.manageLive')}
                          className="rounded p-2 text-accent hover:bg-accent/10"
                        >
                          <Radio size={15} />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(match)}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(match)}
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
        <FixtureForm
          key={editor.id || 'new'}
          initial={editor}
          teams={teams}
          competitions={competitions}
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
        title={
          pendingDelete
            ? `${pendingDelete.homeTeam?.name} vs ${pendingDelete.awayTeam?.name}`
            : undefined
        }
      />
    </>
  )
}
