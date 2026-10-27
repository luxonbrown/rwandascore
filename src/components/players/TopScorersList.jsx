import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

export default function TopScorersList({ scorers = [], limit = 10, className }) {
  const { t } = useI18n()
  const rows = scorers.slice(0, limit)

  return (
    <div className={cn('divide-y divide-line', className)}>
      {rows.map((row) => {
        const player = row.player || row
        return (
          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover"
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold tabular-nums',
                row.rank <= 3 ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted',
              )}
            >
              {row.rank}
            </span>
            {row.team ? <TeamCrest team={row.team} size="sm" /> : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white group-hover:text-accent">
                {player.name}
              </p>
              <p className="truncate text-[11px] text-muted">
                {row.team?.shortName || row.team?.name || t('competitions.amavubi')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div className="hidden w-10 sm:block">
                <p className="text-sm font-bold text-white">{row.assists ?? 0}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted">{t('players.assists')}</p>
              </div>
              <div className="w-9">
                <p className="text-base font-extrabold text-white">{row.goals}</p>
                <p className="text-[9px] uppercase tracking-wide text-muted">{t('players.goals')}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
