import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import FavouriteButton from '../ui/FavouriteButton'
import FormBadges from '../ui/FormBadges'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

export default function TeamCard({ team, className }) {
  const { t } = useI18n()
  const position = team.standing?.position ?? team.position
  const points = team.standing?.points ?? team.points

  return (
    <div className={cn('card relative p-4 transition-colors hover:border-white/15', className)}>
      <FavouriteButton kind="team" id={team.id} className="absolute right-3 top-3" />
      <Link to={`/teams/${team.id}`} className="block pr-9">
        <div className="flex items-start gap-3">
          <TeamCrest team={team} size="lg" />
          <div className="min-w-0 pt-0.5">
            <h3 className="truncate text-sm font-bold text-white">{team.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted">{team.city}</p>
            {position ? (
              <p className="mt-1 text-[11px] font-semibold text-accent">
                {t('teams.position')} {position}
                <span className="text-muted"> · {points} {t('standings.points')}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {t('teams.form')}
          </span>
          <FormBadges form={team.form || []} size="xs" />
        </div>
      </Link>
    </div>
  )
}
