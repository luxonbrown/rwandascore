import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import TeamCrest from '../ui/TeamCrest'
import StatusBadge from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import { useI18n } from '../../hooks/useI18n'
import { formatDateShort, formatTime } from '../../utils/format'
import { isLiveStatus } from '../../utils/media'

function TeamLine({ team, score, winner }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamCrest team={team} size="md" />
        <span
          className={cn(
            'truncate text-sm font-semibold',
            winner ? 'text-white' : 'text-white/90',
          )}
        >
          {team?.name || '—'}
        </span>
      </div>
      <span
        className={cn(
          'w-6 text-right text-lg font-extrabold tabular-nums',
          winner ? 'text-white' : 'text-muted',
        )}
      >
        {score ?? '—'}
      </span>
    </div>
  )
}

export default function MatchCard({ match, className }) {
  const { t } = useI18n()
  const live = isLiveStatus(match.status)
  const upcoming = match.status === 'UPCOMING'
  const finished = match.status === 'FT'
  const homeWinner =
    !upcoming && Number(match.homeScore) > Number(match.awayScore) && match.status !== 'LIVE'
  const awayWinner =
    !upcoming && Number(match.awayScore) > Number(match.homeScore) && match.status !== 'LIVE'

  return (
    <Link
      to={`/matches/${match.id}`}
      className={cn(
        'card group block overflow-hidden transition-colors hover:border-white/15',
        live && 'border-accent/30',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line/80 bg-black/10 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: match.competition?.color || '#FF6B00' }}
          />
          <span className="truncate text-[11px] font-semibold text-muted">
            {match.competition?.shortName || match.competition?.name}
          </span>
        </div>
        <StatusBadge status={match.status} minute={match.minute} showMinute />
      </div>
      <div className="space-y-2.5 px-4 py-3.5">
        <TeamLine team={match.homeTeam} score={match.homeScore} winner={homeWinner || live} />
        <TeamLine team={match.awayTeam} score={match.awayScore} winner={awayWinner || live} />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line/80 px-4 py-2.5 text-[11px] text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          {upcoming ? (
            <>
              <span className="font-semibold text-white/90">{formatTime(match.date)}</span>
              <span>·</span>
              <span>{formatDateShort(match.date)}</span>
            </>
          ) : (
            <>
              <MapPin size={12} />
              <span className="truncate">{match.venue}</span>
            </>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-muted transition-colors group-hover:text-accent">
          {finished ? t('results.finalScore') : upcoming ? t('fixtures.kickoff') : t('live.follow')}
          <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  )
}
