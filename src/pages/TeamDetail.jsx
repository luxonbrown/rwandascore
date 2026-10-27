import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, Trophy, UserRound } from 'lucide-react'
import Container from '../components/ui/Container'
import Tabs from '../components/ui/Tabs'
import MatchRow from '../components/matches/MatchRow'
import PlayerCard from '../components/players/PlayerCard'
import TeamCrest from '../components/ui/TeamCrest'
import FormBadges from '../components/ui/FormBadges'
import FavouriteButton from '../components/ui/FavouriteButton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useTeamDetail } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { positionKey } from '../utils/media'

const groups = ['GK', 'DF', 'MF', 'FW']

export default function TeamDetail() {
  const { id } = useParams()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useTeamDetail(id)
  const team = query.data?.team
  useDocumentTitle(team?.name)

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <div className="skeleton mb-6 h-40 rounded-card" />
        <MatchListSkeleton count={5} />
      </Container>
    )
  }
  if (query.isError) {
    return (
      <Container className="py-10">
        <ErrorState error={query.error} onRetry={query.refetch} />
      </Container>
    )
  }

  const { squad, upcoming, results, standing, form, nextMatch, lastMatch, topScorer } = query.data
  const isNational = team.national
  const tab = searchParams.get('tab') || 'overview'
  const setTab = (value) =>
    setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(circle at 10% 0%, ${team.colors.primary}, transparent 45%), radial-gradient(circle at 90% 100%, ${team.colors.primary}, transparent 40%)`,
          }}
        />
        <Container className="relative py-7 sm:py-9">
          <Link
            to="/teams"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white"
          >
            <ArrowLeft size={14} />
            {t('teams.title')}
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            <TeamCrest team={team} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                {isNational ? t('competitions.national') : t('competitions.rpl')}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{team.name}</h1>
              <p className="text-sm text-muted">{team.nickname}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} />
                  {team.stadium}, {team.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {t('teams.founded')} {team.founded}
                </span>
                {standing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy size={12} />
                    {t('teams.position')} {standing.position}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface/80 px-3 py-2 sm:flex">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t('teams.form')}
                </span>
                <FormBadges form={form} />
              </div>
              <FavouriteButton kind="team" id={team.id} />
            </div>
          </div>
        </Container>
      </section>

      <div className="sticky top-14 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <Container>
          <Tabs
            items={[
              { value: 'overview', label: t('competitions.overview') },
              { value: 'squad', label: t('teams.squad'), count: squad.length },
              { value: 'fixtures', label: t('competitions.fixtures'), count: upcoming.length || undefined },
              { value: 'results', label: t('competitions.results'), count: results.length || undefined },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel={team.name}
            className="border-b-0"
          />
        </Container>
      </div>

      <Container className="py-6">
        {tab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <div className="space-y-6">
              {nextMatch ? (
                <section>
                  <h2 className="section-title mb-2.5">{t('teams.nextMatch')}</h2>
                  <div className="card overflow-hidden">
                    <MatchRow match={nextMatch} showDate showVenue />
                  </div>
                </section>
              ) : null}
              {lastMatch ? (
                <section>
                  <h2 className="section-title mb-2.5">{t('teams.lastMatch')}</h2>
                  <div className="card overflow-hidden">
                    <MatchRow match={lastMatch} showDate />
                  </div>
                </section>
              ) : null}
              {squad.length ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="section-title">{t('teams.squad')}</h2>
                    <button
                      type="button"
                      onClick={() => setTab('squad')}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {squad.slice(0, 4).map((player) => (
                      <PlayerCard key={player.id} player={player} team={team} />
                    ))}
                  </div>
                </section>
              ) : null}
              {!nextMatch && !lastMatch ? <EmptyState title={t('common.noMatches')} /> : null}
            </div>

            <aside className="space-y-6">
              {standing ? (
                <section className="card p-4">
                  <h2 className="section-title mb-3">{t('teams.leaguePosition')}</h2>
                  <div className="flex items-center justify-between rounded-lg bg-surface2/70 p-4">
                    <div>
                      <p className="text-3xl font-extrabold text-accent">#{standing.position}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {standing.points} {t('standings.points')} · {standing.played} {t('standings.played')}
                      </p>
                    </div>
                    <FormBadges form={form} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 divide-x divide-line text-center">
                    <div className="px-2">
                      <p className="text-sm font-bold text-white">{standing.won}</p>
                      <p className="text-[10px] text-muted">{t('standings.won')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-sm font-bold text-white">{standing.drawn}</p>
                      <p className="text-[10px] text-muted">{t('standings.drawn')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-sm font-bold text-white">{standing.lost}</p>
                      <p className="text-[10px] text-muted">{t('standings.lost')}</p>
                    </div>
                  </div>
                  <Link
                    to="/tables"
                    className="mt-3 inline-flex text-xs font-semibold text-accent hover:underline"
                  >
                    {t('standings.fullTable')}
                  </Link>
                </section>
              ) : null}

              {topScorer ? (
                <section className="card p-4">
                  <h2 className="section-title mb-3">{t('teams.topScorer')}</h2>
                  <Link
                    to={`/players/${topScorer.id}`}
                    className="flex items-center gap-3 rounded-lg bg-surface2/60 p-3 transition-colors hover:bg-hover"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold"
                      style={{ backgroundColor: team.colors.primary, color: team.colors.secondary }}
                    >
                      {topScorer.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{topScorer.name}</p>
                      <p className="text-[11px] text-muted">{t(positionKey(topScorer.position))}</p>
                    </div>
                    <span className="text-lg font-extrabold text-accent">{topScorer.stats?.goals}</span>
                  </Link>
                </section>
              ) : null}

              <section className="card p-4">
                <h2 className="section-title mb-3">{t('teams.teamProfile')}</h2>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted">{t('teams.city')}</dt>
                    <dd className="text-right font-semibold text-white">{team.city}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted">{t('teams.stadium')}</dt>
                    <dd className="text-right font-semibold text-white">{team.stadium}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted">{t('teams.nickname')}</dt>
                    <dd className="text-right font-semibold text-white">{team.nickname}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted">{t('teams.founded')}</dt>
                    <dd className="text-right font-semibold text-white">{team.founded}</dd>
                  </div>
                  {team.coach ? (
                    <div className="flex items-start justify-between gap-3 border-t border-line pt-2.5">
                      <dt className="text-muted">{t('teams.coach')}</dt>
                      <dd className="text-right font-semibold text-white">{team.coach.name}</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-muted">{team.description}</p>
              </section>
            </aside>
          </div>
        ) : null}

        {tab === 'squad' ? (
          squad.length ? (
            <div className="space-y-6">
              {groups.map((position) => {
                const players = squad.filter((player) => player.position === position)
                if (!players.length) return null
                return (
                  <section key={position}>
                    <h2 className="section-title mb-2.5">{t(positionKey(position))}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {players.map((player) => (
                        <PlayerCard key={player.id} player={player} team={team} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={UserRound} title={t('teams.noSquad')} />
          )
        ) : null}

        {tab === 'fixtures' ? (
          upcoming.length ? (
            <div className="card divide-y divide-line overflow-hidden">
              {upcoming.map((match) => (
                <MatchRow key={match.id} match={match} showDate showVenue />
              ))}
            </div>
          ) : (
            <EmptyState title={t('common.noMatches')} />
          )
        ) : null}

        {tab === 'results' ? (
          results.length ? (
            <div className="card divide-y divide-line overflow-hidden">
              {results.map((match) => (
                <MatchRow key={match.id} match={match} showDate />
              ))}
            </div>
          ) : (
            <EmptyState title={t('results.noResults')} />
          )
        ) : null}
      </Container>
    </>
  )
}
