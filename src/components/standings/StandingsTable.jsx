import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import FormBadges from '../ui/FormBadges'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

const zoneStyles = {
  'caf-champions-league': 'border-l-info',
  'caf-confederation-cup': 'border-l-accent',
  relegation: 'border-l-negative',
}

export function StandingsLegend({ className }) {
  const { t } = useI18n()
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted', className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1 rounded-full bg-info" />
        {t('standings.championsLeague')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1 rounded-full bg-accent" />
        {t('standings.confederationCup')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-1 rounded-full bg-negative" />
        {t('standings.relegation')}
      </span>
    </div>
  )
}

export default function StandingsTable({
  rows = [],
  limit,
  compact = false,
  highlightTeamIds = [],
  className,
  showForm = true,
}) {
  const { t } = useI18n()
  const tableRows = limit ? rows.slice(0, limit) : rows
  const highlighted = new Set(highlightTeamIds)

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{t('standings.leagueTable')}</caption>
        <thead>
          <tr className="border-b border-line text-[10px] uppercase tracking-wide text-muted">
            <th scope="col" className="w-9 py-2.5 pl-3 text-left font-semibold">
              {t('standings.position')}
            </th>
            <th scope="col" className="py-2.5 text-left font-semibold">
              {t('standings.team')}
            </th>
            <th scope="col" className="w-8 py-2.5 text-center font-semibold" title={t('standings.played')}>
              {t('standings.played')}
            </th>
            {!compact ? (
              <>
                <th scope="col" className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">
                  {t('standings.won')}
                </th>
                <th scope="col" className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">
                  {t('standings.drawn')}
                </th>
                <th scope="col" className="hidden w-8 py-2.5 text-center font-semibold sm:table-cell">
                  {t('standings.lost')}
                </th>
                <th scope="col" className="hidden w-9 py-2.5 text-center font-semibold md:table-cell">
                  {t('standings.gf')}
                </th>
                <th scope="col" className="hidden w-9 py-2.5 text-center font-semibold md:table-cell">
                  {t('standings.ga')}
                </th>
              </>
            ) : null}
            <th scope="col" className="w-9 py-2.5 text-center font-semibold">
              {t('standings.gd')}
            </th>
            <th scope="col" className="w-10 py-2.5 text-center font-semibold">
              {t('standings.points')}
            </th>
            {showForm ? (
              <th scope="col" className="hidden w-28 py-2.5 pr-3 text-right font-semibold lg:table-cell">
                {t('standings.form')}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => {
            const team = row.team
            const isHighlighted = team && highlighted.has(team.id)
            return (
              <tr
                key={row.teamId || team?.id}
                className={cn(
                  'border-b border-line/70 transition-colors hover:bg-hover',
                  isHighlighted && 'bg-accent/[0.06]',
                )}
              >
                <td
                  className={cn(
                    'border-l-2 border-l-transparent py-2.5 pl-3 text-xs font-semibold tabular-nums text-muted',
                    row.zone ? zoneStyles[row.zone] : '',
                  )}
                >
                  {row.position}
                </td>
                <td className="py-2.5">
                  <Link
                    to={`/teams/${team?.id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-white hover:text-accent"
                  >
                    <TeamCrest team={team} size="sm" />
                    <span className="truncate">{team?.name || row.teamId}</span>
                  </Link>
                </td>
                <td className="py-2.5 text-center text-xs tabular-nums text-muted">{row.played}</td>
                {!compact ? (
                  <>
                    <td className="hidden py-2.5 text-center text-xs tabular-nums text-muted sm:table-cell">
                      {row.won}
                    </td>
                    <td className="hidden py-2.5 text-center text-xs tabular-nums text-muted sm:table-cell">
                      {row.drawn}
                    </td>
                    <td className="hidden py-2.5 text-center text-xs tabular-nums text-muted sm:table-cell">
                      {row.lost}
                    </td>
                    <td className="hidden py-2.5 text-center text-xs tabular-nums text-muted md:table-cell">
                      {row.gf}
                    </td>
                    <td className="hidden py-2.5 text-center text-xs tabular-nums text-muted md:table-cell">
                      {row.ga}
                    </td>
                  </>
                ) : null}
                <td
                  className={cn(
                    'py-2.5 text-center text-xs font-semibold tabular-nums',
                    row.gd > 0 ? 'text-positive' : row.gd < 0 ? 'text-negative' : 'text-muted',
                  )}
                >
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="py-2.5 text-center text-sm font-extrabold tabular-nums text-white">
                  {row.points}
                </td>
                {showForm ? (
                  <td className="hidden py-2.5 pr-3 text-right lg:table-cell">
                    <FormBadges form={row.form || []} size="xs" />
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
