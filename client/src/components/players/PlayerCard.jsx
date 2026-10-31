import { Link } from 'react-router-dom'
import TeamCrest from '../ui/TeamCrest'
import FavouriteButton from '../ui/FavouriteButton'
import { useI18n } from '../../hooks/useI18n'
import { positionKey } from '../../utils/media'
import { cn } from '../../utils/cn'
import PlayerAvatar from './PlayerAvatar'

export default function PlayerCard({ player, team, className }) {
  const { t } = useI18n()
  const primary = team?.colors?.primary || '#2B2B2B'
  const secondary = team?.colors?.secondary || '#FFFFFF'
  const goals = player.stats?.goals ?? player.goals ?? 0
  const assists = player.stats?.assists ?? player.assists ?? 0

  return (
    <div className={cn('card relative overflow-hidden p-4 transition-colors hover:border-white/15', className)}>
      <FavouriteButton kind="player" id={player.id} className="absolute right-3 top-3" />
      <Link to={`/players/${player.id}`} className="group block">
        <div className="flex items-center gap-3 pr-9">
          <PlayerAvatar player={player} className="h-14 w-14 rounded-xl border border-white/10 bg-surface2" fallbackClassName="text-2xl font-bold" fallbackStyle={{ backgroundColor: primary, color: secondary }} />
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
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-3 py-1 text-[11px] font-bold text-white">
            <span className="tabular-nums">{goals}</span>
            <span className="text-[9px] uppercase tracking-wide text-muted">{t('players.goals')}</span>
          </span>
          {assists > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-3 py-1 text-[11px] font-bold text-white">
              <span className="tabular-nums">{assists}</span>
              <span className="text-[9px] uppercase tracking-wide text-muted">{t('players.assists')}</span>
            </span>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
