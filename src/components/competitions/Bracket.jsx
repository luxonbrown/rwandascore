import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'
import { dayKeyOf } from '../../utils/format'

function BracketMatch({ match }) {
  const { t } = useI18n()
  if (!match) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface2/40 px-3 py-4 text-center text-xs text-muted">
        {t('competitions.tbd')}
      </div>
    )
  }
  const finished = match.status === 'FT'
  const homeWin = finished && Number(match.homeScore) > Number(match.awayScore)
  const awayWin = finished && Number(match.awayScore) > Number(match.homeScore)
  return (
    <Link
      to={`/matches/${match.id}`}
      className={cn(
        'block rounded-lg border bg-surface2/70 px-3 py-2.5 transition-colors hover:border-accent/40',
        match.status === 'LIVE' ? 'border-accent/40' : 'border-line',
      )}
    >
      <div className="space-y-1.5">
        {[
          { team: match.homeTeam, score: match.homeScore, winner: homeWin },
          { team: match.awayTeam, score: match.awayScore, winner: awayWin },
        ].map(({ team, score, winner }) => (
          <div key={team?.id || score} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <TeamCrest team={team} size="xs" />
              <span
                className={cn(
                  'truncate text-xs',
                  winner ? 'font-bold text-white' : 'text-white/80',
                )}
              >
                {team?.shortName || team?.name || t('competitions.tbd')}
              </span>
            </span>
            <span className="text-xs font-bold tabular-nums text-white">{score ?? '—'}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        {match.status === 'LIVE' ? `${match.minute}'` : finished ? 'FT' : dayKeyOf(match.date)}
      </p>
    </Link>
  )
}

export default function Bracket({ bracket = [], className }) {
  const { t } = useI18n()
  const rounds = bracket.filter((round) => round.matches?.length)

  if (!rounds.length) {
    return <p className="px-4 py-8 text-center text-sm text-muted">{t('competitions.noBracket')}</p>
  }

  return (
    <div className={cn('grid gap-5 md:grid-cols-3', className)}>
      {rounds.map((round) => (
        <section key={round.round}>
          <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">
            {round.round}
          </h3>
          <div className="space-y-2.5">
            {round.matches.map((match) => (
              <BracketMatch key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
