import { Link } from 'react-router-dom'
import { Star, Trash2, UserRound, Users } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import MatchCard from '../components/matches/MatchCard'
import TeamCard from '../components/teams/TeamCard'
import PlayerCard from '../components/players/PlayerCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton, MatchListSkeleton } from '../components/ui/Skeletons'
import { useFavouritesData } from '../hooks/useData'
import { usePreferencesStore } from '../store/preferences'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

export default function Favourites() {
  const { t } = useI18n()
  useDocumentTitle(t('favourites.title'))
  const teamIds = usePreferencesStore((state) => state.favouriteTeams)
  const playerIds = usePreferencesStore((state) => state.favouritePlayers)
  const clearFavourites = usePreferencesStore((state) => state.clearFavourites)
  const query = useFavouritesData(teamIds, playerIds)
  const hasFavourites = teamIds.length > 0 || playerIds.length > 0
  const { teams = [], players = [], matches = [] } = query.data || {}

  return (
    <>
      <PageHeader
        eyebrow={t('nav.favourites')}
        title={t('favourites.title')}
        subtitle={t('favourites.subtitle')}
        actions={
          hasFavourites ? (
            <button
              type="button"
              onClick={clearFavourites}
              className="btn btn-ghost text-xs text-muted hover:text-red-400"
            >
              <Trash2 size={14} />
              {t('common.clear')} ({teamIds.length + playerIds.length})
            </button>
          ) : null
        }
      />

      <Container className="py-7">
        {!hasFavourites ? (
          <EmptyState
            icon={Star}
            title={t('favourites.empty')}
            body={t('favourites.emptyBody')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/teams" className="btn btn-accent">
                  <Users size={15} />
                  {t('favourites.exploreTeams')}
                </Link>
                <Link to="/players" className="btn btn-secondary">
                  <UserRound size={15} />
                  {t('favourites.explorePlayers')}
                </Link>
              </div>
            }
          />
        ) : query.isLoading ? (
          <div className="space-y-8">
            <CardGridSkeleton count={4} />
            <MatchListSkeleton count={4} />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <div className="space-y-8">
            {teams.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('favourites.teams')}</h2>
                  <span className="text-[11px] font-semibold text-muted">
                    {t('favourites.count', { count: teams.length })}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {teams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </section>
            ) : null}

            {players.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('favourites.players')}</h2>
                  <span className="text-[11px] font-semibold text-muted">
                    {t('favourites.count', { count: players.length })}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {players.map((player) => (
                    <PlayerCard key={player.id} player={player} team={player.team} />
                  ))}
                </div>
              </section>
            ) : null}

            {matches.length ? (
              <section>
                <h2 className="section-title mb-3">{t('favourites.matches')}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ) : (
              <EmptyState
                icon={Star}
                title={t('favourites.noMatches')}
                body={t('favourites.noMatchesBody')}
                action={
                  <Link to="/fixtures" className="btn btn-secondary">
                    {t('competitions.allFixtures')}
                  </Link>
                }
              />
            )}
          </div>
        )}
      </Container>
    </>
  )
}
