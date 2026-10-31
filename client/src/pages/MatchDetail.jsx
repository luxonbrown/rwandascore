import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  CircleDot,
  ImageOff,
  MapPin,
  Play,
  Shield,
  Trophy,
  UserRound,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react'
import Container from '../components/ui/Container'
import Tabs from '../components/ui/Tabs'
import TeamCrest from '../components/ui/TeamCrest'
import StatusBadge from '../components/ui/StatusBadge'
import ShareButton from '../components/ui/ShareButton'
import MatchRow from '../components/matches/MatchRow'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useHeadToHead, useMatch } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { formatDateLong, formatTime } from '../utils/format'
import { usePreferencesStore } from '../store/preferences'
import { startSoundtrack, stopSoundtrack } from '../utils/soundtrack'
import PlayerAvatar from '../components/players/PlayerAvatar'

const eventTypes = {
  goal: ['match.goal', 'text-accent', FootballIcon],
  penalty: ['match.penalty', 'text-accent', FootballIcon],
  own_goal: ['match.ownGoal', 'text-red-400', FootballIcon],
  yellow: ['match.yellow', 'text-yellow-400', CardIcon],
  red: ['match.red', 'text-red-400', CardIcon],
  sub: ['match.sub', 'text-sky-300', ArrowLeftRight],
  substitution: ['match.sub', 'text-sky-300', ArrowLeftRight],
  shot: ['match.shot', 'text-sky-300', CircleDot],
  shot_on_target: ['match.shotOnTargetEvent', 'text-positive', CircleDot],
  shot_off_target: ['match.shotOffTarget', 'text-muted', CircleDot],
  save: ['match.save', 'text-purple-300', Shield],
  position: ['match.playerPosition', 'text-accent', UserRound],
}

function CardIcon({ className = '' }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-2.5 rounded-[2px] bg-current shadow-sm ${className}`} />
}

function FootballIcon({ size = 16, className = '' }) {
  const id = useId().replaceAll(':', '')
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <defs>
        <radialGradient id={`${id}-ball-white`} cx="34%" cy="25%" r="78%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.62" stopColor="#f1f1ed" />
          <stop offset="1" stopColor="#aeb3b6" />
        </radialGradient>
        <linearGradient id={`${id}-ball-black`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#323436" />
          <stop offset="0.45" stopColor="#050607" />
          <stop offset="1" stopColor="#191b1c" />
        </linearGradient>
        <clipPath id={`${id}-ball-edge`}><circle cx="12" cy="12" r="10" /></clipPath>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id}-ball-white)`} stroke="#222629" strokeWidth="1.25" />
      <g clipPath={`url(#${id}-ball-edge)`} stroke="#d6d5d0" strokeWidth="0.65" strokeLinejoin="round">
        <path d="m12 7.35 3.75 2.72-1.43 4.42h-4.64l-1.43-4.42L12 7.35Z" fill={`url(#${id}-ball-black)`} />
        <path d="m10.3 7.35-1.5-3.9 3.2-2.2 3.1 2.2-1.35 3.9L12 7.35Z" fill={`url(#${id}-ball-black)`} />
        <path d="m15.75 10.07 3.95-.8 2 3.15-1.65 3.2-3.7-2.13 1.43-3.42Z" fill={`url(#${id}-ball-black)`} />
        <path d="m14.32 14.49 2.65 3.03-.85 3.8-3.65 1.05-1.35-3.9 2.57-3.98Z" fill={`url(#${id}-ball-black)`} />
        <path d="m9.68 14.49-2.6 3.03.8 3.8 3.65 1.05 1.35-3.9-2.57-3.98Z" fill={`url(#${id}-ball-black)`} />
        <path d="m8.25 10.07-3.95-.8-2 3.15 1.65 3.2 3.7-2.13-1.43-3.42Z" fill={`url(#${id}-ball-black)`} />
        <path d="m12 7.35-.2-5.9M15.75 10.07l5.95-.8M14.32 14.49l2.65 6.83M9.68 14.49l-2.6 6.83M8.25 10.07 2.3 9.27" fill="none" />
      </g>
      <ellipse cx="8" cy="5.1" rx="3.2" ry="1.2" fill="#fff" opacity="0.42" transform="rotate(-28 8 5.1)" />
    </svg>
  )
}

const statRows = [
  ['possession', 'match.possession', true],
  ['shots', 'match.shots'],
  ['shotsOnTarget', 'match.shotsOnTarget'],
  ['corners', 'match.corners'],
  ['fouls', 'match.fouls'],
  ['yellow', 'match.yellowCards'],
  ['red', 'match.redCards'],
]

function PhotoTile({ photo }) {
  const [failed, setFailed] = useState(false)
  if (failed || !photo.url) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-line bg-gradient-to-br from-surface2 to-pitch text-muted">
        <ImageOff size={22} />
        <span className="px-3 text-center text-[11px]">{photo.caption}</span>
      </div>
    )
  }
  return (
    <figure className="group relative overflow-hidden rounded-lg border border-line bg-surface2">
      <img
        src={photo.url}
        alt={photo.caption}
        loading="lazy"
        onError={() => setFailed(true)}
        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-[11px] font-medium text-white">
        {photo.caption}
      </figcaption>
    </figure>
  )
}

function StatBar({ label, values, percent }) {
  const [home, away] = values
  const total = percent ? 100 : Math.max(1, home + away)
  const homeShare = percent ? home : Math.round((home / total) * 100)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="w-8 tabular-nums text-white">{home}{percent ? '%' : ''}</span>
        <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
        <span className="w-8 text-right tabular-nums text-white">{away}{percent ? '%' : ''}</span>
      </div>
      <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-surface2">
        <div className="rounded-full bg-accent" style={{ width: `${homeShare}%` }} />
        <div className="flex-1 rounded-full bg-white/25" />
      </div>
    </div>
  )
}

function EventPlayerNames({ event, t, fallback }) {
  const substitution = event.type === 'sub' || event.type === 'substitution'
  if (!substitution) return event.playerName || t(fallback || 'match.goal')
  return (
    <>
      <span className="block text-emerald-300">{t('match.subIn')}: {event.playerName || event.player || '—'}</span>
      <span className="block text-slate-500">{t('match.subOut')}: {event.playerOut || event.assistName || '—'}</span>
    </>
  )
}

function LineupSide({ homeLineup, awayLineup, homeTeam, awayTeam, t, live = false, backgroundImageUrl = null }) {
  const renderPlayer = (player, team) => {
    const primary = team.colors?.primary || '#f97316'
    const secondary = team.colors?.secondary || '#ffffff'
    return (
      <Link key={player.playerId} to={`/players/${player.playerId}`} className="group flex w-[3.8rem] flex-col items-center gap-0.5 px-0.5 text-center sm:w-[4.6rem]">
        <PlayerAvatar player={player} className="h-8 w-8 rounded-full border border-white/80 bg-white text-[11px] font-black text-slate-900 shadow sm:h-9 sm:w-9 sm:text-xs" fallbackClassName="text-[9px] text-slate-900" number={player.number} numberClassName="bg-black/80 text-white" />
        <span className="max-w-full truncate rounded bg-black/55 px-1 text-[8px] font-bold leading-tight text-white group-hover:text-accent sm:text-[9px]">{player.name}</span>
      </Link>
    )
  }
  const renderRows = (lineup, team, reverse = false) => {
    const rows = reverse ? [...(lineup?.rows || [])].reverse() : lineup?.rows || []
    return rows.map((row) => (
      <div className="relative z-10 flex justify-center" key={`${team.id}-${row.label}`}>
        <div className="flex w-full items-start justify-around gap-0.5">
          {row.players.map((player) => renderPlayer(player, team))}
        </div>
      </div>
    ))
  }
  const renderBench = (lineup, team) => (
    <div className="min-w-0">
      <h3 className="mb-2 truncate text-[10px] font-bold text-white">{team.name}</h3>
      {lineup?.bench?.length ? <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
        {lineup.bench.map((player) => <li key={player.playerId}>
          <Link to={`/players/${player.playerId}`} className="flex min-w-0 items-center gap-2 rounded px-1 py-1 text-[10px] text-white/90 hover:bg-hover">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/50 bg-white/10 text-[9px] font-bold text-white">{player.number}</span>
            <span className="min-w-0"><span className="block truncate font-semibold">{player.name}</span><span className="block text-[9px] text-muted">{player.position || ''}</span></span>
          </Link>
        </li>)}
      </ul> : <p className="text-[10px] text-muted">—</p>}
    </div>
  )
  return (
    <section className="card overflow-hidden">
      <div
        className="relative isolate flex min-h-[37rem] flex-col overflow-hidden border-b border-white/20 bg-[linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(135deg,#124b2e,#0b3b25)] bg-[size:50%_100%,100%_25%,auto] px-2 py-4 sm:px-4"
        style={backgroundImageUrl ? {
          backgroundImage: `linear-gradient(rgba(5, 35, 19, .72), rgba(5, 35, 19, .72)), url("${backgroundImageUrl.replaceAll('"', '%22')}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className="pointer-events-none absolute inset-2 rounded border border-white/35" />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 border-t border-white/30" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
        <div className="pointer-events-none absolute inset-x-[34%] top-2 h-[9%] border-x border-b border-white/30" />
        <div className="pointer-events-none absolute inset-x-[34%] bottom-2 h-[9%] border-x border-t border-white/30" />
        <div className="absolute left-4 top-4 z-20 flex max-w-[45%] items-center gap-2 rounded-lg bg-black/45 p-1.5 backdrop-blur-sm">
          <TeamCrest team={homeTeam} size="sm" />
          <div className="min-w-0"><p className="truncate text-[10px] font-bold text-white">{homeTeam.name}</p><p className="text-[9px] font-semibold text-white/70">{homeLineup?.formation}</p></div>
        </div>
        <div className="absolute right-4 bottom-4 z-20 flex max-w-[45%] items-center gap-2 rounded-lg bg-black/45 p-1.5 text-right backdrop-blur-sm">
          <div className="min-w-0"><p className="truncate text-[10px] font-bold text-white">{awayTeam.name}</p><p className="text-[9px] font-semibold text-white/70">{awayLineup?.formation}</p></div>
          <TeamCrest team={awayTeam} size="sm" />
        </div>
        <div className="relative z-10 flex min-h-[18rem] flex-1 flex-col justify-around py-2">
          {renderRows(homeLineup, homeTeam)}
        </div>
        <div className="relative z-10 flex min-h-[18rem] flex-1 flex-col justify-around py-2">
          {renderRows(awayLineup, awayTeam, true)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-3 text-xs font-extrabold text-white">{live ? t('match.remainingSubstitutes') : t('match.bench') || 'Bench'}</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {renderBench(homeLineup, homeTeam)}
          {renderBench(awayLineup, awayTeam)}
        </div>
      </div>
    </section>
  )
}

function lineupWithSubstitutions(lineup, teamId, events = []) {
  if (!lineup) return null
  const current = {
    ...lineup,
    rows: (lineup.rows || []).map((row) => ({ ...row, players: [...(row.players || [])] })),
    bench: [...(lineup.bench || [])],
  }
  const substitutions = events
    .filter((event) => (event.type === 'sub' || event.type === 'substitution') && event.teamId === teamId)
    .sort((a, b) => Number(a.minute || 0) - Number(b.minute || 0))

  for (const event of substitutions) {
    const outgoingId = event.relatedPlayerId
    const incomingId = event.playerId
    const row = current.rows.find((candidate) => candidate.players.some((player) =>
      (outgoingId && player.playerId === outgoingId) || (!outgoingId && event.playerOut && player.name === event.playerOut)))
    if (!row) continue
    const outgoingIndex = row.players.findIndex((player) =>
      (outgoingId && player.playerId === outgoingId) || (!outgoingId && event.playerOut && player.name === event.playerOut))
    const outgoing = row.players[outgoingIndex]
    const benchIndex = current.bench.findIndex((player) =>
      (incomingId && player.playerId === incomingId) || (!incomingId && event.playerName && player.name === event.playerName))
    const incoming = benchIndex >= 0 ? current.bench.splice(benchIndex, 1)[0] : {
      playerId: incomingId || `sub-${event.id || event.minute}`,
      name: event.playerName || event.player || '—',
      number: event.playerNumber ?? '',
      position: outgoing?.position,
      rating: null,
    }
    row.players[outgoingIndex] = incoming
    if (outgoing) current.bench.push(outgoing)
  }
  return current
}

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMatch(id)
  const match = query.data
  const crowdSoundEnabled = usePreferencesStore((state) => state.crowdSoundEnabled)
  const toggleCrowdSound = usePreferencesStore((state) => state.toggleCrowdSound)
  const isLiveMatch = match?.status === 'LIVE' || match?.status === 'HT'
  useEffect(() => {
    if (isLiveMatch && crowdSoundEnabled) void startSoundtrack()
    else stopSoundtrack()
    return () => stopSoundtrack()
  }, [id, isLiveMatch, crowdSoundEnabled])
  const h2hQuery = useHeadToHead(match?.homeTeamId, match?.awayTeamId)
  useDocumentTitle(match ? `${match.homeTeam?.name} vs ${match.awayTeam?.name}` : t('common.loading'))

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <div className="skeleton mb-6 h-56 rounded-card" />
        <MatchListSkeleton count={4} />
      </Container>
    )
  }
  if (query.isError) {
    return (
      <Container className="py-10">
        <ErrorState error={query.error} onRetry={query.refetch} />
      </Container>
    )
  }

  const { homeTeam, awayTeam, competition, events, stats, lineups, photos, highlights } = match
  const upcoming = match.status === 'UPCOMING'
  const live = match.status === 'LIVE' || match.status === 'HT'
  const played = ['FT', 'LIVE', 'HT'].includes(match.status)
  const tab = searchParams.get('tab') || 'overview'
  const setTab = (value) => setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  const h2h = h2hQuery.data || []
  const displayStats = { ...(stats || {}) }
  for (const cardType of ['yellow', 'red']) {
    const recorded = Array.isArray(displayStats[cardType]) ? displayStats[cardType] : [0, 0]
    displayStats[cardType] = [homeTeam?.id, awayTeam?.id].map((teamId, side) => Math.max(
      Number(recorded[side]) || 0,
      (events || []).filter((event) => event.type === cardType && event.teamId === teamId).length,
    ))
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 0% 0%, ${homeTeam?.colors?.primary || '#FF6B00'}, transparent 42%), radial-gradient(circle at 100% 100%, ${awayTeam?.colors?.primary || '#1E1E1E'}, transparent 45%)`,
          }}
        />
        <Container className="relative py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white"
            >
              <ArrowLeft size={14} />
              {t('common.back')}
            </button>
            <div className="flex items-center gap-2">
              <StatusBadge status={match.status} minute={match.minute} showMinute />
              {live ? <button type="button" data-sound="off" onClick={toggleCrowdSound} aria-pressed={crowdSoundEnabled} className="btn btn-secondary p-2" aria-label={t(crowdSoundEnabled ? 'live.muteCrowd' : 'live.enableCrowd')} title={t(crowdSoundEnabled ? 'live.muteCrowd' : 'live.enableCrowd')}>
                {crowdSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
              </button> : null}
              <ShareButton
                title={`${homeTeam?.name} vs ${awayTeam?.name}`}
                text={`${homeTeam?.name} ${match.homeScore}-${match.awayScore} ${awayTeam?.name}`}
              />
            </div>
          </div>

          <Link
            to={`/competitions/${competition?.id}`}
            className="mx-auto flex w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-accent"
          >
            <Trophy size={12} />
            {competition?.name} · {match.round}
          </Link>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <Link to={`/teams/${homeTeam?.id}`} className="group flex flex-col items-center gap-2 text-center">
              <TeamCrest team={homeTeam} size="xl" />
              <span className="text-sm font-bold text-white group-hover:text-accent sm:text-base">
                {homeTeam?.name}
              </span>
              <span className="hidden text-[10px] text-muted sm:inline">{homeTeam?.city}</span>
            </Link>

            <div className="text-center">
              {upcoming ? (
                <>
                  <p className="text-3xl font-extrabold tabular-nums text-white sm:text-4xl">
                    {formatTime(match.date)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-muted">{t('common.vs')}</p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black tabular-nums tracking-tight text-white sm:text-5xl">
                    {match.homeScore} <span className="text-muted">–</span> {match.awayScore}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {match.status === 'FT' ? t('results.finalScore') : t('common.liveNow')}
                  </p>
                </>
              )}
            </div>

            <Link to={`/teams/${awayTeam?.id}`} className="group flex flex-col items-center gap-2 text-center">
              <TeamCrest team={awayTeam} size="xl" />
              <span className="text-sm font-bold text-white group-hover:text-accent sm:text-base">
                {awayTeam?.name}
              </span>
              <span className="hidden text-[10px] text-muted sm:inline">{awayTeam?.city}</span>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={12} />
              {formatDateLong(match.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} />
              {match.venue}, {match.city}
            </span>
            {match.attendance ? (
              <span className="inline-flex items-center gap-1.5">
                <Users size={12} />
                {match.attendance.toLocaleString('en-GB')}
              </span>
            ) : null}
          </div>
        </Container>
      </section>

      <div className="sticky top-14 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <Container>
          <Tabs
            items={[
              { value: 'overview', label: t('match.overview') },
              { value: 'stats', label: t('match.stats') },
              { value: 'lineups', label: t('match.lineups') },
              { value: 'timeline', label: t('match.timeline'), count: events.length || undefined },
              { value: 'photos', label: t('match.photos'), count: photos.length || undefined },
              { value: 'highlights', label: t('match.highlights'), count: highlights.length || undefined },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel={`${homeTeam?.name} vs ${awayTeam?.name}`}
            className="border-b-0"
          />
        </Container>
      </div>

      <Container className="py-6">
        {tab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <div className="space-y-6">
              <section className="card p-4">
                <h2 className="section-title mb-3">{t('match.matchInfo')}</h2>
                <dl className="grid gap-x-6 gap-y-2.5 text-xs sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.competition')}</dt>
                    <dd className="font-semibold text-white">{competition?.name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.round')}</dt>
                    <dd className="font-semibold text-white">{match.round}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.date')}</dt>
                    <dd className="font-semibold text-white">{formatDateLong(match.date)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.venue')}</dt>
                    <dd className="text-right font-semibold text-white">{match.venue}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('match.referee')}</dt>
                    <dd className="text-right font-semibold text-white">{match.referee}</dd>
                  </div>
                  {match.attendance ? (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">{t('match.attendance')}</dt>
                      <dd className="font-semibold text-white">{match.attendance.toLocaleString('en-GB')}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {events.length ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="section-title">{t('match.timeline')}</h2>
                    <button
                      type="button"
                      onClick={() => setTab('timeline')}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>
                  <div className="card divide-y divide-line overflow-hidden">
                    {events.slice(0, 4).map((event, index) => {
                      const [labelKey, color, Icon] = eventTypes[event.type] || eventTypes.goal
                      return (
                        <div key={`${event.minute}-${index}`} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="w-7 shrink-0 text-right text-[11px] font-bold tabular-nums text-muted">
                            {event.minute}&apos;
                          </span>
                          <Icon size={14} className={color} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                              <EventPlayerNames event={event} t={t} fallback={labelKey} />
                            </p>
                            <p className="truncate text-[10px] text-muted">
                              {event.teamId === homeTeam?.id ? homeTeam?.name : awayTeam?.name}
                              {event.detail ? ` · ${event.detail}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase text-muted">
                            {t(labelKey)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6">
              {played && stats ? (
                <section className="card p-4">
                  <h2 className="section-title mb-3">{t('match.stats')}</h2>
                  <div className="space-y-3">
                    {statRows.slice(0, 5).map(([key, label, percent]) => (
                      <StatBar
                        key={key}
                        label={t(label)}
                        values={displayStats[key] || [0, 0]}
                        percent={percent}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              <section>
                <h2 className="section-title mb-2.5">{t('match.headToHead')}</h2>
                {h2hQuery.isLoading ? (
                  <MatchListSkeleton count={3} />
                ) : h2h.length ? (
                  <div className="card divide-y divide-line overflow-hidden">
                    {h2h.map((item) => (
                      <MatchRow key={item.id} match={item} showDate />
                    ))}
                  </div>
                ) : (
                  <p className="card p-4 text-xs text-muted">{t('match.noH2H')}</p>
                )}
              </section>
            </aside>
          </div>
        ) : null}

        {tab === 'stats' ? (
          played && stats ? (
            <section className="card mx-auto max-w-2xl p-5">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <span className="flex items-center gap-2 text-xs font-bold text-white">
                  <TeamCrest team={homeTeam} size="xs" />
                  {homeTeam?.shortName || homeTeam?.name}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted">{t('match.stats')}</span>
                <span className="flex items-center gap-2 text-xs font-bold text-white">
                  {awayTeam?.shortName || awayTeam?.name}
                  <TeamCrest team={awayTeam} size="xs" />
                </span>
              </div>
              <div className="space-y-4">
                {statRows.map(([key, label, percent]) => (
                  <StatBar key={key} label={t(label)} values={displayStats[key] || [0, 0]} percent={percent} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState icon={Trophy} title={t('match.noStats')} />
          )
        ) : null}

        {tab === 'lineups' ? (
          lineups ? (
            <section>
              {live ? <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-positive"><span className="h-2 w-2 animate-pulse rounded-full bg-positive" />{t('match.currentLineups')}</p> : null}
              <LineupSide
                homeLineup={live ? lineupWithSubstitutions(lineups.home, homeTeam?.id, events) : lineups.home}
                awayLineup={live ? lineupWithSubstitutions(lineups.away, awayTeam?.id, events) : lineups.away}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                t={t}
                live={live}
                backgroundImageUrl={live ? stats?.liveBackgroundImageUrl : null}
              />
            </section>
          ) : (
            <EmptyState icon={UserRound} title={live ? t('match.noLiveLineups') : t('match.noLineups')} />
          )
        ) : null}

        {tab === 'timeline' ? (
          events.length ? (
            <div className="mx-auto max-w-3xl space-y-2">
              {events.map((event, index) => {
                const [labelKey, color, Icon] = eventTypes[event.type] || eventTypes.goal
                const home = event.teamId === homeTeam?.id
                return (
                  <div
                    key={`${event.minute}-${index}`}
                    className="card flex items-start gap-3 p-3.5"
                  >
                    <span className="flex w-9 shrink-0 flex-col items-center">
                      <span className="text-xs font-extrabold tabular-nums text-white">{event.minute}&apos;</span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase text-muted">
                        {home ? 'H' : 'A'}
                      </span>
                    </span>
                    <span className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        <EventPlayerNames event={event} t={t} fallback={labelKey} />
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-muted">
                          {t(labelKey)}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted">
                        {home ? homeTeam?.name : awayTeam?.name}
                        {event.playerOut && event.type !== 'sub' && event.type !== 'substitution' ? ` · ${t('match.subOn')} ${event.playerOut}` : ''}
                      </p>
                      {event.assistName && event.type !== 'sub' && event.type !== 'substitution' ? (
                        <p className="text-[10px] text-muted">
                          {t('match.assist')}: {event.assistName}
                        </p>
                      ) : null}
                      {event.detail ? <p className="mt-0.5 text-[11px] text-white/60">{event.detail}</p> : null}
                      {event.x != null && event.y != null ? <>
                        <p className="mt-1 text-[10px] text-accent">{t('match.pitchLocation')}: {event.x}%, {event.y}%</p>
                        <div className="relative mt-2 aspect-[2/1] max-w-sm overflow-hidden rounded-lg border border-white/30 bg-emerald-900/80" aria-label={`${t('match.pitchLocation')} ${event.x}%, ${event.y}%`}>
                          <span className="absolute inset-[5%] rounded border border-white/35" />
                          <span className="absolute bottom-[5%] left-1/2 top-[5%] border-l border-white/35" />
                          <span className="absolute left-1/2 top-1/2 h-[28%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />
                          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow" style={{ left: `${5 + Number(event.x) * 0.9}%`, top: `${5 + Number(event.y) * 0.9}%` }} />
                        </div>
                      </> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={CircleDot} title={t('match.noEvents')} />
          )
        ) : null}

        {tab === 'photos' ? (
          photos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <PhotoTile key={`${photo.url}-${index}`} photo={photo} />
              ))}
            </div>
          ) : (
            <EmptyState icon={ImageOff} title={t('match.noPhotos') || t('match.noEvents')} />
          )
        ) : null}

        {tab === 'highlights' ? (
          highlights.length ? (
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="card flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Play size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{highlight.title}</p>
                    <p className="text-[11px] text-muted">{highlight.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Play} title={t('match.highlightsSoon')} />
          )
        ) : null}
      </Container>
    </>
  )
}
