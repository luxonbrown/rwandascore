import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import TeamCrest from '../ui/TeamCrest'
import StatusBadge from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import { useI18n } from '../../hooks/useI18n'
import { formatDateShort, formatTime } from '../../utils/format'
import { isLiveStatus } from '../../utils/media'

function TeamSide({ team, align = 'right' }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        align === 'right' ? 'justify-end text-right' : 'justify-start text-left',
      )}
    >
      {align === 'left' ? <TeamCrest team={team} size="sm" /> : null}
      <span className="truncate text-sm font-semibold text-white group-hover:text-white">
        {team?.shortName || team?.name || '—'}
      </span>
      {align === 'right' ? <TeamCrest team={team} size="sm" /> : null}
    </div>
  )
}

export default function MatchRow({ match, showDate = false, showVenue = false, className }) {
  const { t } = useI18n()
  const live = isLiveStatus(match.status)
  const upcoming = match.status === 'UPCOMING'
  const score = `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
  const centerLabel = upcoming ? formatTime(match.date) : score

  return (
    <Link
      to={`/matches/${match.id}`}
      aria-label={`${match.homeTeam?.name} ${centerLabel} ${match.awayTeam?.name}`}
      className={cn(
        'group flex items-center gap-2 px-3 py-3 transition-colors sm:gap-4 sm:px-4',
        live ? 'row-live' : 'hover:bg-hover',
        className,
      )}
    >
      <TeamSide team={match.homeTeam} align="right" />
      <div className="flex w-[70px] shrink-0 flex-col items-center gap-0.5 sm:w-24">
        <span
          className={cn(
            'text-sm font-extrabold tabular-nums sm:text-base',
            live ? 'text-accent' : upcoming ? 'text-white' : 'text-white',
          )}
        >
          {centerLabel}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <StatusBadge status={match.status} minute={match.minute} showMinute />
        </span>
      </div>
      <TeamSide team={match.awayTeam} align="left" />
      {showDate ? (
        <span className="hidden w-16 shrink-0 text-right text-[11px] text-muted sm:block">
          {formatDateShort(match.date)}
        </span>
      ) : null}
      {showVenue ? (
        <span className="hidden w-40 shrink-0 items-center gap-1 text-right text-[11px] text-muted lg:flex">
          <MapPin size={12} />
          <span className="truncate">{match.venue}</span>
        </span>
      ) : null}
      <span className="sr-only">{t('common.match')}</span>
    </Link>
  )
}
