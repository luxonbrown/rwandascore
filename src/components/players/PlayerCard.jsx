import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import TeamCrest from '../ui/TeamCrest'
import FavouriteButton from '../ui/FavouriteButton'
import { useI18n } from '../../hooks/useI18n'
import { positionKey } from '../../utils/media'
import { cn } from '../../utils/cn'

export default function PlayerCard({ player, team, className }) {
  const { t } = useI18n()
  const primary = team?.colors?.primary || '#2B2B2B'
  const secondary = team?.colors?.secondary || '#FFFFFF'

  return (
    <div className={cn('card relative overflow-hidden p-4 transition-colors hover:border-white/15', className)}>
      <FavouriteButton kind="player" id={player.id} className="absolute right-3 top-3" />
      <Link to={`/players/${player.id}`} className="group block">
        <div className="flex items-center gap-3 pr-9">
          <span
            className="relative flex h-14 w-12 shrink-0 items-end justify-center overflow-hidden rounded-lg pb-1 text-lg font-extrabold"
            style={{ backgroundColor: primary, color: secondary }}
          >
            <span className="relative z-10">{player.number ?? '—'}</span>
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white/10" />
            <span className="absolute -bottom-2 -left-2 h-7 w-7 rounded-full bg-black/10" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white group-hover:text-accent">
              {player.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {t(positionKey(player.position))} · {player.nationality}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/70">
              {team ? <TeamCrest team={team} size="xs" /> : null}
              <span className="truncate">{team?.shortName || team?.name || t('competitions.amavubi')}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-3 text-center">
          <div>
            <p className="text-base font-extrabold text-white">{player.stats?.goals ?? 0}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              {t('players.goals')}
            </p>
          </div>
          <div>
            <p className="text-base font-extrabold text-white">{player.stats?.assists ?? 0}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              {t('players.assists')}
            </p>
          </div>
          <div>
            <p className="text-base font-extrabold text-white">{player.stats?.appearances ?? 0}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              {t('players.appearances')}
            </p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted group-hover:text-accent">
          {t('players.viewProfile')}
          <ArrowUpRight size={12} />
        </span>
      </Link>
    </div>
  )
}
