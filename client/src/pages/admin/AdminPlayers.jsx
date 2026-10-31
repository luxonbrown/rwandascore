import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import TableFrame from '../../components/admin/TableFrame'
import PlayerFaceField from '../../components/admin/PlayerFaceField'
import PlayerAvatar from '../../components/players/PlayerAvatar'
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
import { uploadAdminPlayerFace } from '../../services/api'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { positionKey } from '../../utils/media'

const positions = ['GK', 'DF', 'MF', 'FW']
const footOptions = ['Right', 'Left']

const statFields = [
  'appearances',
  'goals',
  'assists',
  'yellowCards',
  'redCards',
  'minutes',
  'cleanSheets',
]

const emptyForm = {
  name: '',
  teamId: '',
  position: 'MF',
  number: '',
  nationality: 'Rwanda',
  age: '',
  height: '',
  foot: 'Right',
  faceId: '',
  nationalTeam: false,
  bio: '',
  appearances: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  minutes: 0,
  cleanSheets: 0,
}

function playerToForm(player) {
  return {
    ...emptyForm,
    ...player,
    faceId: player.faceId || player.photoUrl || '',
    number: player.number ?? '',
    age: player.age ?? '',
    height: player.height ?? '',
    ...Object.fromEntries(statFields.map((key) => {
      const statKey = key === 'yellowCards' || key === 'redCards' ? key.replace('Cards', '') : key
      return [key, player.stats?.[key] ?? player.stats?.[statKey] ?? player[key] ?? 0]
    })),
  }
}

function PlayerForm({ initial, teams, onSubmit, onClose, isPending, error }) {
  const { t } = useI18n()
  const [form, setForm] = useState(initial)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <FormModal
      open
      onClose={onClose}
      title={initial.id ? t('common.edit') : t('admin.players.new')}
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
          <label htmlFor="player-name" className="label">
            {t('admin.form.name')} *
          </label>
          <input
            id="player-name"
            className="input"
            required
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>
        <PlayerFaceField value={form.faceId} onChange={(value) => set('faceId', value)} upload={uploadAdminPlayerFace} />
        <div>
          <label htmlFor="player-team" className="label">
            {t('admin.form.team')} *
          </label>
          <select
            id="player-team"
            className="input"
            required
            value={form.teamId}
            onChange={(event) => set('teamId', event.target.value)}
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
          <label htmlFor="player-position" className="label">
            {t('admin.form.position')}
          </label>
          <select
            id="player-position"
            className="input"
            value={form.position}
            onChange={(event) => set('position', event.target.value)}
          >
            {positions.map((position) => (
              <option key={position} value={position}>
                {t(positionKey(position))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="player-number" className="label">
            {t('admin.form.number')}
          </label>
          <input
            id="player-number"
            type="number"
            min="1"
            max="99"
            className="input"
            value={form.number}
            onChange={(event) => set('number', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="player-nationality" className="label">
            {t('admin.form.nationality')}
          </label>
          <input
            id="player-nationality"
            className="input"
            value={form.nationality}
            onChange={(event) => set('nationality', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="player-age" className="label">
            {t('admin.form.age')}
          </label>
          <input
            id="player-age"
            type="number"
            min="14"
            max="45"
            className="input"
            value={form.age}
            onChange={(event) => set('age', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="player-height" className="label">
            {t('admin.form.height')}
          </label>
          <input
            id="player-height"
            type="number"
            min="140"
            max="220"
            className="input"
            value={form.height}
            onChange={(event) => set('height', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="player-foot" className="label">
            {t('admin.form.foot')}
          </label>
          <select
            id="player-foot"
            className="input"
            value={form.foot}
            onChange={(event) => set('foot', event.target.value)}
          >
            {footOptions.map((foot) => (
              <option key={foot} value={foot}>
                {t(foot === 'Left' ? 'players.left' : 'players.right')}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-white">
          <input
            type="checkbox"
            checked={Boolean(form.nationalTeam)}
            onChange={(event) => set('nationalTeam', event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          {t('admin.form.nationalTeam')}
        </label>

        <div className="sm:col-span-2">
          <h3 className="mb-2 mt-1 text-xs font-bold uppercase tracking-wider text-muted">
            {t('players.seasonStats')}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statFields.map((key) => (
              <div key={key}>
                <label htmlFor={`player-${key}`} className="label">
                  {t(`admin.form.${key}`)}
                </label>
                <input
                  id={`player-${key}`}
                  type="number"
                  min="0"
                  className="input"
                  value={form[key]}
                  onChange={(event) => set(key, event.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="player-bio" className="label">
            {t('admin.form.bio')}
          </label>
          <textarea
            id="player-bio"
            className="input min-h-24"
            value={form.bio}
            onChange={(event) => set('bio', event.target.value)}
          />
        </div>
      </div>
    </FormModal>
  )
}

export default function AdminPlayers() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.players.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const pushToast = useUiStore((state) => state.pushToast)
  const playersQuery = useAdminCollection('players')
  const teamsQuery = useAdminCollection('teams')
  const createItem = useCreateAdminItem('players')
  const updateItem = useUpdateAdminItem('players')
  const deleteItem = useDeleteAdminItem('players')
  const [editor, setEditor] = useState(() =>
    searchParams.get('new') === '1' ? { ...emptyForm } : null,
  )
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')

  const closeEditor = () => {
    setEditor(null)
    setFormError('')
    if (searchParams.get('new')) setSearchParams({}, { replace: true })
  }

  const openCreate = () => {
    setFormError('')
    setEditor({ ...emptyForm })
  }

  const openEdit = (player) => {
    setFormError('')
    setEditor(playerToForm(player))
  }

  const save = async (form) => {
    setFormError('')
    const payload = {
      name: form.name,
      teamId: form.teamId || null,
      position: form.position,
      number: form.number,
      faceId: form.faceId || null,
      nationality: form.nationality,
      age: form.age,
      height: form.height,
      foot: form.foot,
      nationalTeam: form.nationalTeam,
      bio: form.bio,
      ...Object.fromEntries(statFields.map((key) => [key, form[key]])),
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

  const teams = teamsQuery.data || []
  const players = (playersQuery.data || []).filter((player) => {
    if (teamFilter && player.teamId !== teamFilter) return false
    if (positionFilter && player.position !== positionFilter) return false
    return `${player.name} ${player.team?.name || ''} ${player.nationality}`
      .toLowerCase()
      .includes(search.toLowerCase())
  })

  return (
    <>
      <AdminPageHeader
        title={t('admin.players.title')}
        subtitle={t('admin.players.subtitle')}
        actions={
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            <Plus size={16} />
            {t('admin.players.new')}
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
            aria-label={t('admin.players.filterTeam')}
            className="input sm:w-52"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <option value="">{t('admin.players.filterTeam')}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.players.filterPosition')}
            className="input sm:w-44"
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
          >
            <option value="">{t('admin.players.filterPosition')}</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {t(positionKey(position))}
              </option>
            ))}
          </select>
        </div>

        <TableFrame
          isLoading={playersQuery.isLoading}
          error={playersQuery.error}
          onRetry={playersQuery.refetch}
          isEmpty={!players.length}
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={openCreate}>
              <Plus size={16} />
              {t('admin.players.new')}
            </button>
          }
        >
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.player')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.team')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.position')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.number')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.apps')}</th>
                <th className="px-4 py-3 font-bold">{t('admin.players.columns.goals')}</th>
                <th className="px-4 py-3 text-right font-bold">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-hover/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5"><PlayerAvatar player={player} className="h-9 w-9 rounded-full border border-line bg-surface2 text-[10px] font-bold text-white"/><div className="min-w-0"><p className="truncate font-semibold text-white">{player.name}</p><p className="text-[10px] text-muted">{player.nationality}</p></div></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TeamCrest team={player.team} size="xs" />
                      <span className="text-xs text-muted">{player.team?.shortName || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{t(positionKey(player.position))}</td>
                  <td className="px-4 py-3 text-xs font-bold text-white">{player.number || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">{player.stats?.appearances ?? 0}</td>
                  <td className="px-4 py-3 text-xs font-bold text-accent">{player.stats?.goals ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(player)}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        className="rounded p-2 text-muted hover:bg-hover hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(player)}
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
        <PlayerForm
          key={editor.id || 'new'}
          initial={editor}
          teams={teams}
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
      />
    </>
  )
}
