import { Star } from 'lucide-react'
import { usePreferencesStore } from '../../store/preferences'
import { useI18n } from '../../hooks/useI18n'
import { cn } from '../../utils/cn'

export default function FavouriteButton({ kind = 'team', id, className, size = 17 }) {
  const { t } = useI18n()
  const teams = usePreferencesStore((state) => state.favouriteTeams)
  const players = usePreferencesStore((state) => state.favouritePlayers)
  const toggleFavouriteTeam = usePreferencesStore((state) => state.toggleFavouriteTeam)
  const toggleFavouritePlayer = usePreferencesStore((state) => state.toggleFavouritePlayer)

  const active = kind === 'team' ? teams.includes(id) : players.includes(id)
  const label = active ? t('favourites.remove') : t(kind === 'team' ? 'favourites.followTeam' : 'favourites.followPlayer')

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={() => (kind === 'team' ? toggleFavouriteTeam(id) : toggleFavouritePlayer(id))}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
        active
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-line bg-surface2 text-muted hover:border-accent/30 hover:text-white',
        className,
      )}
    >
      <Star size={size} fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
