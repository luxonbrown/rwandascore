import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleDot, ImagePlus, Radio, Save, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import TeamCrest from '../../components/ui/TeamCrest'
import {
  useAddMatchEvent,
  useAdminCollection,
  useAdminDashboard,
  useAdminMatchEvents,
  useDeleteMatchEvent,
  useUpdateLiveMatch,
  useUpdateMatchLiveBackground,
} from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useUiStore } from '../../store/ui'
import { useAuthStore } from '../../store/auth'
import { cn } from '../../utils/cn'
import { dayKeyOf, formatDate, formatTime } from '../../utils/format'
import { initialsOf, isLiveStatus, statusKey } from '../../utils/media'

const eventTypes = [
  { value: 'goal', key: 'match.goal' },
  { value: 'penalty', key: 'match.penalty' },
  { value: 'own_goal', key: 'match.ownGoal' },
  { value: 'yellow', key: 'match.yellow' },
  { value: 'red', key: 'match.red' },
  { value: 'substitution', key: 'match.sub' },
  { value: 'shot', label: 'Shot' },
  { value: 'shot_on_target', label: 'Shot on target' },
  { value: 'shot_off_target', label: 'Shot off target' },
  { value: 'save', label: 'Save' },
  { value: 'position', label: 'Player position' },
]

const eventTone = {
  goal: 'bg-positive/15 text-positive',
  penalty: 'bg-positive/15 text-positive',
  own_goal: 'bg-negative/15 text-negative',
  yellow: 'bg-yellow-400/15 text-yellow-400',
  red: 'bg-negative/15 text-negative',
  substitution: 'bg-accent/15 text-accent',
  shot: 'bg-sky-400/15 text-sky-300',
  shot_on_target: 'bg-positive/15 text-positive',
  shot_off_target: 'bg-muted/15 text-muted',
  save: 'bg-purple-400/15 text-purple-300',
  position: 'bg-accent/15 text-accent',
}

function squadNames(roster = []) {
  return [...new Set(roster.map((player) => player.name).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
}

function ScoreEditor({ match, onUpdate, isPending }) {
  const { t } = useI18n()
  const [minute, setMinute] = useState(match.minute ?? 0)
  const [minuteOverride, setMinuteOverride] = useState(null)
  const [stoppageMinutes, setStoppageMinutes] = useState('')
  const [status, setStatus] = useState(['LIVE', 'HT', 'FT'].includes(match.status) ? match.status : 'LIVE')

  useEffect(() => {
    setMinute(match.minute ?? 0)
    setMinuteOverride(null)
    setStatus(['LIVE', 'HT', 'FT'].includes(match.status) ? match.status : 'LIVE')
    setStoppageMinutes('')
  }, [match.id, match.minute, match.status, match.clock?.awaitingStoppage, match.clock?.awaitingFullTime])

  useEffect(() => {
    const clock = match.clock
    if (match.status !== 'LIVE' || !clock?.running || !clock.startedAt) return undefined

    const tick = () => {
      const elapsed = Math.floor(Math.max(0, Date.now() - new Date(clock.startedAt).getTime()) / 60_000)
      const target = Number(clock.targetMinute) || (clock.period === 1 ? 45 : 90)
      setMinute(Math.min(target, Number(clock.baseMinute || 0) + elapsed))
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [match.id, match.status, match.clock?.running, match.clock?.startedAt, match.clock?.baseMinute, match.clock?.targetMinute, match.clock?.period])

  const displayedMinute = minuteOverride ?? minute

  const submit = (nextStatus = status, extra = {}) => {
    onUpdate({
      minute: Number(displayedMinute),
      status: nextStatus,
      ...extra,
    })
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-gradient-to-r from-accent/10 via-surface to-surface px-5 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {match.competition?.shortName || match.competition?.name}
            {match.round ? ` · ${match.round}` : ''}
          </p>
          <StatusBadge status={match.status} minute={displayedMinute} showMinute />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
            <TeamCrest team={match.homeTeam} size="lg" />
            <div>
              <p className="text-sm font-bold text-white">{match.homeTeam?.name}</p>
              <p className="text-[10px] text-muted">{t('match.home')}</p>
            </div>
          </div>
          <p className="text-3xl font-black tabular-nums text-white">
            {match.homeScore}–{match.awayScore}
          </p>
          <div className="flex flex-col-reverse items-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right">
            <div>
              <p className="text-sm font-bold text-white">{match.awayTeam?.name}</p>
              <p className="text-[10px] text-muted">{t('match.away')}</p>
            </div>
            <TeamCrest team={match.awayTeam} size="lg" />
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">
          {formatDate(match.date)} · {formatTime(match.date)} · {match.venue || '—'}
        </p>
      </div>

      <form
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <h2 className="section-title">{t('admin.live.currentScore')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="live-minute" className="label">
              {t('admin.live.minute')}
            </label>
            <input
              id="live-minute"
              type="number"
              min="0"
              max="120"
              className="input text-center text-lg font-bold"
              value={displayedMinute}
              onChange={(event) => setMinuteOverride(event.target.value)}
            />
          </div>
          <p className="flex items-end justify-center pb-2 text-xs font-semibold text-muted">Goals are added from the match timeline.</p>
        </div>
        <div>
          <label htmlFor="live-status" className="label">
            {t('admin.live.matchStatus')}
          </label>
          <select
            id="live-status"
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {['LIVE', 'HT', 'FT'].map((value) => (
              <option key={value} value={value}>
                {t(statusKey(value))}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['LIVE', 'admin.live.goLive'],
            ['HT', 'admin.live.halfTime'],
            ['FT', 'admin.live.fullTime'],
          ].map(([value, key]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value)
                submit(value)
              }}
              disabled={isPending}
              className={cn(
                'btn',
                status === value ? 'btn-accent' : 'btn-secondary',
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
        {match.clock?.awaitingStoppage || match.clock?.awaitingFullTime ? (
          <div className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div>
              <p className="text-sm font-bold text-white">{match.clock.period === 1 ? 'First half paused at 45 minutes' : `Second half paused at ${match.minute} minutes`}</p>
              <p className="mt-1 text-xs text-muted">Add stoppage time and resume, or confirm the period has ended.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="w-36"><span className="label">Stoppage minutes</span><input className="input" type="number" min="1" max="30" value={stoppageMinutes} onChange={(event) => setStoppageMinutes(event.target.value)} placeholder="e.g. 4" /></label>
              <button type="button" className="btn btn-accent" disabled={isPending || !Number(stoppageMinutes)} onClick={() => submit('LIVE', { minute: match.minute, stoppageMinutes: Number(stoppageMinutes) })}>Resume with added time</button>
              <button type="button" className="btn btn-secondary" disabled={isPending} onClick={() => submit(match.clock.period === 1 ? 'HT' : 'FT', { minute: match.minute })}>Confirm {match.clock.period === 1 ? 'half-time' : 'full-time'}</button>
            </div>
          </div>
        ) : null}
        <button type="submit" className="btn btn-accent w-full" disabled={isPending}>
          <Radio size={15} />
          {isPending ? t('admin.live.updating') : t('admin.live.update')}
        </button>
      </form>
    </section>
  )
}

const matchStatFields = [
  ['possession', 'match.possession', true],
  ['shots', 'match.shots'],
  ['shotsOnTarget', 'match.shotsOnTarget'],
  ['corners', 'match.corners'],
  ['fouls', 'match.fouls'],
]

function MatchStatsEditor({ match, onSave, isPending }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() => Object.fromEntries(matchStatFields.map(([key]) => [key, match.stats?.[key] || [0, 0]])))
  const possessionValid = Number(values.possession?.[0] || 0) + Number(values.possession?.[1] || 0) === 100
  const setValue = (key, side, value) => setValues((current) => ({
    ...current,
    [key]: current[key].map((item, index) => index === side ? value : item),
  }))

  return (
    <form className="card space-y-4 p-5" onSubmit={(event) => {
      event.preventDefault()
      onSave(Object.fromEntries(matchStatFields.map(([key]) => [key, values[key].map(Number)])))
    }}>
      <div>
        <h2 className="section-title">{t('match.stats')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.live.statsHint')}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-x-3 gap-y-2 text-center">
        <span />
        <span className="truncate text-[10px] font-bold uppercase text-muted">{match.homeTeam?.shortName || t('match.home')}</span>
        <span className="truncate text-[10px] font-bold uppercase text-muted">{match.awayTeam?.shortName || t('match.away')}</span>
        {matchStatFields.map(([key, label, percent]) => (
          <div key={key} className="contents">
            <label className="text-left text-xs font-semibold text-white" htmlFor={`match-stat-${key}-home`}>{t(label)}</label>
            {[0, 1].map((side) => (
              <input
                key={side}
                id={`match-stat-${key}-${side === 0 ? 'home' : 'away'}`}
                className="input px-2 text-center tabular-nums"
                type="number"
                min="0"
                max={percent ? 100 : 999}
                step="1"
                value={values[key]?.[side] ?? 0}
                onChange={(event) => setValue(key, side, event.target.value)}
                aria-label={`${t(label)} · ${side === 0 ? match.homeTeam?.name : match.awayTeam?.name}`}
              />
            ))}
          </div>
        ))}
      </div>
      {!possessionValid ? <p className="text-xs text-negative">{t('admin.live.possessionTotal')}</p> : null}
      <button type="submit" className="btn btn-accent w-full" disabled={isPending || !possessionValid}>
        <Save size={14} />
        {isPending ? t('admin.saving') : t('common.save')}
      </button>
    </form>
  )
}

function EventPanel({ match, roster, rosterLoading, onAdd, onDelete, addPending, deletePending }) {
  const { t } = useI18n()
  const homePlayers = squadNames(roster.filter((player) => player.teamId === match.homeTeamId))
  const awayPlayers = squadNames(roster.filter((player) => player.teamId === match.awayTeamId))
  const [form, setForm] = useState({
    type: 'goal',
    teamId: match.homeTeamId,
    playerName: '',
    assistName: '',
    detail: '',
    x: '',
    y: '',
    minute: match.minute || 1,
  })
  const [removeIndex, setRemoveIndex] = useState(null)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      teamId: match.homeTeamId,
      minute: match.minute || 1,
      playerName: '',
      assistName: '',
      detail: '',
      x: '',
      y: '',
    }))
  }, [match.id, match.homeTeamId, match.minute])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const playerNames = form.teamId === match.homeTeamId ? homePlayers : awayPlayers
  const events = [...(match.events || [])].sort((a, b) => a.minute - b.minute)

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="section-title">{t('admin.live.events')}</h2>
      </div>
      <form
        className="grid gap-3 border-b border-line p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          onAdd(form, () =>
            setForm((current) => ({
              ...current,
              playerName: '',
              assistName: '',
              detail: '',
              x: '',
              y: '',
            })),
          )
        }}
      >
        <div>
          <label htmlFor="event-type" className="label">
            {t('admin.live.eventType')}
          </label>
          <select
            id="event-type"
            className="input"
            value={form.type}
            onChange={(event) => set('type', event.target.value)}
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label || t(type.key)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-team" className="label">
            {t('admin.live.eventTeam')}
          </label>
          <select
            id="event-team"
            className="input"
            value={form.teamId}
            onChange={(event) => {
              set('teamId', event.target.value)
              set('playerName', '')
            }}
          >
            <option value={match.homeTeamId}>{match.homeTeam?.name}</option>
            <option value={match.awayTeamId}>{match.awayTeam?.name}</option>
          </select>
        </div>
        <div>
          <label htmlFor="event-player" className="label">
            {t('admin.live.eventPlayer')} *
          </label>
          <select
            id="event-player"
            className="input"
            required
            disabled={rosterLoading || !playerNames.length}
            value={form.playerName}
            onChange={(event) => set('playerName', event.target.value)}
          >
            <option value="">
              {rosterLoading
                ? t('admin.live.loadingPlayers')
                : playerNames.length
                  ? t('admin.live.choosePlayer')
                  : t('admin.live.noTeamPlayers')}
            </option>
            {playerNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-minute" className="label">
            {t('admin.live.eventMinute')} *
          </label>
          <input
            id="event-minute"
            type="number"
            min="0"
            max="120"
            required
            className="input"
            value={form.minute}
            onChange={(event) => set('minute', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="event-assist" className="label">
            {t('admin.live.eventAssist')}
          </label>
          <input
            id="event-assist"
            className="input"
            list={`assists-${form.teamId}`}
            value={form.assistName}
            onChange={(event) => set('assistName', event.target.value)}
          />
          <datalist id={`assists-${form.teamId}`}>
            {playerNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="event-detail" className="label">
            {t('admin.live.eventDetail')}
          </label>
          <input
            id="event-detail"
            className="input"
            value={form.detail}
            onChange={(event) => set('detail', event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="label">Pitch location <span className="font-normal normal-case text-muted">(tap the field to place this event; coordinates are percentages)</span></p>
          <button type="button" aria-label="Set event position on pitch" onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            set('x', Math.round(((event.clientX - rect.left) / rect.width) * 100))
            set('y', Math.round(((event.clientY - rect.top) / rect.height) * 100))
          }} className="relative mt-1 block aspect-[2/1] w-full overflow-hidden rounded-xl border border-white/40 bg-emerald-800/80">
            <span className="absolute inset-[5%] rounded border border-white/40" />
            <span className="absolute bottom-[5%] left-1/2 top-[5%] border-l border-white/40" />
            <span className="absolute left-1/2 top-1/2 h-[28%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
            {form.x !== '' && form.y !== '' ? <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow" style={{ left: `${5 + Number(form.x) * 0.9}%`, top: `${5 + Number(form.y) * 0.9}%` }} /> : null}
            <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white/80">{form.x !== '' ? `X ${form.x}% · Y ${form.y}%` : 'Select a location'}</span>
          </button>
        </div>
        <div className="flex items-end sm:col-span-2">
          <button type="submit" className="btn btn-accent" disabled={addPending}>
            <CircleDot size={15} />
            {addPending ? t('admin.saving') : t('admin.live.saveEvent')}
          </button>
        </div>
      </form>

      {events.length ? (
        <ul className="divide-y divide-line">
          {events.map((event, index) => {
            const team =
              event.teamId === match.homeTeamId ? match.homeTeam : match.awayTeam
            return (
              <li key={event.id || `${event.minute}-${index}`} className="flex items-center gap-3 px-5 py-3">
                <span className="w-8 shrink-0 text-center text-xs font-black tabular-nums text-muted">
                  {event.minute}'
                </span>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-bold',
                    eventTone[event.type] || 'bg-surface2 text-muted',
                  )}
                >
                  {eventTypes.find((type) => type.value === event.type)?.label || t(eventTypes.find((type) => type.value === event.type)?.key || 'match.goal')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {event.playerName || event.player}
                    {(event.assistName || event.relatedPlayer) ? (
                      <span className="font-normal text-muted"> ({event.assistName || event.relatedPlayer})</span>
                    ) : null}
                  </p>
          <p className="text-[10px] text-muted">
                    {team?.name}
                    {event.detail || event.note ? ` · ${event.detail || event.note}` : ''}
            {event.x != null && event.y != null ? ` · Pitch ${event.x}%, ${event.y}%` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveIndex(index)}
                  aria-label={t('admin.live.remove')}
                  title={t('admin.live.remove')}
                  className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-muted">{t('admin.live.noEvents')}</p>
      )}

      <ConfirmDeleteModal
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        onConfirm={() => {
          onDelete(events[removeIndex]?.id, () => setRemoveIndex(null))
        }}
        isPending={deletePending}
        title={t('admin.live.confirmRemove')}
        warning={t('admin.live.removeWarning')}
      />
    </section>
  )
}

export default function AdminLive() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.liveControl'))
  const pushToast = useUiStore((state) => state.pushToast)
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const fixturesQuery = useAdminCollection('fixtures', { refetchInterval: 10000 })
  const playersQuery = useAdminCollection('players')
  const dashboardQuery = useAdminDashboard({ enabled: user?.role === 'ADMIN' })
  const updateLive = useUpdateLiveMatch()
  const updateBackground = useUpdateMatchLiveBackground()
  const addEvent = useAddMatchEvent()
  const deleteEvent = useDeleteMatchEvent()
  const [selectedId, setSelectedId] = useState(() => searchParams.get('matchId') || '')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const eventsQuery = useAdminMatchEvents(selectedId)

  const today = dayKeyOf(new Date())
  const candidates = (fixturesQuery.data || [])
    .filter((match) => isLiveStatus(match.status) || dayKeyOf(match.date) === today)
    .sort((a, b) => {
      const liveDelta = Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status))
      return liveDelta || new Date(a.date) - new Date(b.date)
    })

  useEffect(() => {
    if (!candidates.length) {
      setSelectedId('')
      return
    }
    if (!selectedId || !candidates.some((match) => match.id === selectedId)) {
      const preferredId = searchParams.get('matchId')
      const nextId = preferredId && candidates.some((match) => match.id === preferredId) ? preferredId : candidates[0].id
      setSelectedId(nextId)
      setSearchParams({ matchId: nextId }, { replace: true })
    }
  }, [candidates, selectedId, searchParams, setSearchParams])

  if (fixturesQuery.isError) {
    return (
      <>
        <AdminPageHeader title={t('admin.live.title')} subtitle={t('admin.live.subtitle')} />
        <div className="p-4 sm:p-6 lg:p-8">
          <ErrorState error={fixturesQuery.error} onRetry={fixturesQuery.refetch} />
        </div>
      </>
    )
  }

  const match = candidates.find((item) => item.id === selectedId)

  useEffect(() => {
    setBackgroundUrl(match?.stats?.liveBackgroundImageUrl || '')
  }, [match?.id, match?.stats?.liveBackgroundImageUrl])

  const updateScore = async (updates, reset) => {
    try {
      await updateLive.mutateAsync({ matchId: match.id, updates })
      pushToast(t('admin.live.updated'))
      reset?.()
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const updateStats = async (stats) => {
    try {
      await updateLive.mutateAsync({ matchId: match.id, updates: { stats } })
      pushToast(t('admin.live.statsSaved'))
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const saveBackground = async (event) => {
    event.preventDefault()
    try {
      await updateBackground.mutateAsync({ matchId: match.id, imageUrl: backgroundUrl.trim() })
      pushToast(t('admin.live.backgroundSaved'))
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const submitEvent = async (form, reset) => {
    try {
      await addEvent.mutateAsync({
        matchId: match.id,
        event: {
          ...form,
          minute: Number(form.minute),
          x: form.x === '' ? undefined : Number(form.x),
          y: form.y === '' ? undefined : Number(form.y),
        },
      })
      pushToast(t('admin.live.eventAdded'))
      reset()
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  const removeEvent = async (index, done) => {
    try {
      await deleteEvent.mutateAsync({ matchId: match.id, index })
      pushToast(t('admin.live.eventRemoved'))
      done()
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  return (
    <>
      <AdminPageHeader
        title={t('admin.live.title')}
        subtitle={t('admin.live.subtitle')}
        actions={
          <Link to="/live" target="_blank" className="btn btn-secondary">
            <Radio size={15} />
            {t('admin.openLive')}
          </Link>
        }
      />
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="card p-4">
          <label htmlFor="live-match" className="label">
            {t('admin.live.selectMatch')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="live-match"
              className="input sm:max-w-md"
              value={selectedId}
              onChange={(event) => { setSelectedId(event.target.value); setSearchParams(event.target.value ? { matchId: event.target.value } : {}, { replace: true }) }}
              disabled={!candidates.length}
            >
              {candidates.length ? (
                <option value="">{t('admin.live.chooseMatch')}</option>
              ) : (
                <option value="">{t('admin.live.noMatches')}</option>
              )}
              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.homeTeam?.shortName} {item.homeScore}–{item.awayScore}{' '}
                  {item.awayTeam?.shortName} · {formatTime(item.date)}
                </option>
              ))}
            </select>
            {match ? (
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
                </span>
                {t('home.liveNow')}
              </div>
            ) : null}
          </div>
        </div>

        {fixturesQuery.isLoading ? (
          <div className="card p-10 text-center text-sm text-muted">{t('admin.loading')}</div>
        ) : !match ? (
          <EmptyState
            icon={Radio}
            title={t('admin.live.noMatches')}
            body={t('admin.live.subtitle')}
            action={
              <Link to="/admin/fixtures" className="btn btn-accent">
                {t('admin.fixtures.title')}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <ScoreEditor
                key={match.id}
                match={match}
                onUpdate={updateScore}
                isPending={updateLive.isPending}
              />
              <MatchStatsEditor key={`stats-${match.id}`} match={match} onSave={updateStats} isPending={updateLive.isPending} />
              <form className="card space-y-3 p-4" onSubmit={saveBackground}>
                <div className="flex items-center gap-2">
                  <ImagePlus size={16} className="text-accent" />
                  <div>
                    <h2 className="section-title">{t('admin.live.backgroundTitle')}</h2>
                    <p className="text-[11px] text-muted">{t('admin.live.backgroundHint')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    className="input min-w-0 flex-1"
                    value={backgroundUrl}
                    onChange={(event) => setBackgroundUrl(event.target.value)}
                    placeholder="https://example.com/match-teams.jpg"
                    aria-label={t('admin.live.backgroundTitle')}
                  />
                  <button type="submit" className="btn btn-accent" disabled={updateBackground.isPending}>
                    <Save size={14} />
                    {updateBackground.isPending ? t('admin.saving') : t('common.save')}
                  </button>
                </div>
                {backgroundUrl ? <img src={backgroundUrl} alt={t('admin.live.backgroundPreview')} className="h-28 w-full rounded-lg border border-line object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
              </form>
              <EventPanel
                key={`events-${match.id}`}
                match={{ ...match, events: eventsQuery.data || match.events || [] }}
                roster={playersQuery.data || []}
                rosterLoading={playersQuery.isLoading}
                onAdd={submitEvent}
                onDelete={removeEvent}
                addPending={addEvent.isPending}
                deletePending={deleteEvent.isPending}
              />
            </div>

            <aside className="space-y-5">
              {user?.role === 'ADMIN' ? <section className="card overflow-hidden">
                <div className="border-b border-line px-4 py-3.5">
                  <h2 className="section-title">{t('admin.live.presenceTitle')}</h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {t('admin.live.presenceSubtitle')}
                  </p>
                </div>
                <ul className="divide-y divide-line">
                  {(dashboardQuery.data?.presence || []).map((entry) => (
                    <li key={entry.userId} className="flex items-center gap-3 px-4 py-3">
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold text-white">
                        {initialsOf(entry.name)}
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
                            entry.status === 'online' ? 'bg-positive' : 'bg-muted',
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{entry.name}</p>
                        <p className="truncate text-[10px] text-muted">
                          {entry.workingOn || t('admin.live.editingNow')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section> : null}

              <section className="card p-4">
                <h2 className="section-title mb-2">{t('match.matchInfo')}</h2>
                <dl className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.competition')}</dt>
                    <dd className="font-semibold text-white">{match.competition?.shortName || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.round')}</dt>
                    <dd className="font-semibold text-white">{match.round || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.venue')}</dt>
                    <dd className="truncate font-semibold text-white">{match.venue || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('admin.live.status')}</dt>
                    <dd className="font-semibold text-white">{t(statusKey(match.status))}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}
