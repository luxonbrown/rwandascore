import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Flag, MapPin, Trophy } from 'lucide-react'
import Container from '../components/ui/Container'
import Tabs from '../components/ui/Tabs'
import MatchRow from '../components/matches/MatchRow'
import StandingsTable, { StandingsLegend } from '../components/standings/StandingsTable'
import TopScorersList from '../components/players/TopScorersList'
import PlayerCard from '../components/players/PlayerCard'
import Bracket from '../components/competitions/Bracket'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useCompetitionData } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { formatDateLong } from '../utils/format'

const typeLabels = {
  league: 'competitions.league',
  cup: 'competitions.cup',
  national: 'competitions.national',
}

function MatchGroup({ title, matches }) {
  if (!matches.length) return null
  return (
    <section>
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">{title}</h3>
      <div className="card divide-y divide-line overflow-hidden">
        {matches.map((match) => (
          <MatchRow key={match.id} match={match} showDate />
        ))}
      </div>
    </section>
  )
}

export default function CompetitionDetail() {
  const { id } = useParams()
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useCompetitionData(id)
  const competition = query.data?.competition
  useDocumentTitle(competition?.name)

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <div className="skeleton mb-6 h-36 rounded-card" />
        <MatchListSkeleton count={6} />
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

  const matches = query.data.matches || []
  const standings = query.data.standings || []
  const topScorers = query.data.topScorers || []
  const nationalSquad = query.data.nationalSquad || []
  const upcoming = matches.filter((match) => match.status === 'UPCOMING')
  const live = matches.filter((match) => match.status === 'LIVE' || match.status === 'HT')
  const results = matches.filter((match) => match.status === 'FT').reverse()
  const isCup = competition.type === 'cup'
  const isNational = competition.type === 'national'
  const tab = searchParams.get('tab') || 'overview'
  const setTab = (value) =>
    setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })

  const tabs = [
    { value: 'overview', label: t('competitions.overview') },
    isCup
      ? { value: 'bracket', label: t('competitions.bracket') }
      : { value: 'table', label: t('competitions.table'), count: standings.length || undefined },
    { value: 'fixtures', label: t('competitions.fixtures'), count: upcoming.length || undefined },
    { value: 'results', label: t('competitions.results'), count: results.length || undefined },
    { value: 'scorers', label: t('competitions.topScorers') },
    ...(isNational
      ? [{ value: 'squad', label: t('teams.squad'), count: nationalSquad.length || undefined }]
      : []),
  ]

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 12% 0%, ${competition.color}, transparent 42%), radial-gradient(circle at 90% 110%, ${competition.color}, transparent 40%)`,
          }}
        />
        <Container className="relative py-7 sm:py-9">
          <Link
            to="/competitions"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white"
          >
            <ArrowLeft size={14} />
            {t('competitions.title')}
          </Link>
          <div className="flex flex-wrap items-start gap-4">
            <span
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-black shadow-lift"
              style={{
                backgroundColor: competition.color,
                color: competition.secondaryColor || '#fff',
              }}
            >
              {competition.logoText || competition.shortName}
              {competition.logoUrl ? <img src={competition.logoUrl} alt="" className="absolute inset-0 z-10 h-full w-full bg-surface object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                {t(typeLabels[competition.type] || 'competitions.competitions')} · {competition.season}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{competition.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">{competition.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} />
                  {competition.country}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy size={12} />
                  {competition.teamCount} {t('competitions.teams')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {competition.season}
                </span>
                {isNational ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Flag size={12} />
                    {t('competitions.national')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <div className="sticky top-14 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <Container>
          <Tabs
            items={tabs}
            value={tab}
            onChange={setTab}
            ariaLabel={competition.name}
            className="border-b-0"
          />
        </Container>
      </div>

      <Container className="py-6">
        {tab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <div className="space-y-6">
              {live.length ? <MatchGroup title={t('home.liveNow')} matches={live} /> : null}
              {isCup && query.data.bracket?.length ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="section-title">{t('competitions.bracket')}</h2>
                    <button
                      type="button"
                      onClick={() => setTab('bracket')}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>
                  <div className="card p-4">
                    <Bracket bracket={query.data.bracket} />
                  </div>
                </section>
              ) : null}
              <MatchGroup title={t('home.nextUp')} matches={upcoming.slice(0, 4)} />
              <MatchGroup title={t('results.title')} matches={results.slice(0, 4)} />
              {!live.length && !upcoming.length && !results.length ? (
                <EmptyState title={t('common.noMatches')} />
              ) : null}
            </div>

            <aside className="space-y-6">
              {standings.length ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="section-title">{t('competitions.leagueTable')}</h2>
                    <button
                      type="button"
                      onClick={() => setTab('table')}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>
                  <div className="card overflow-hidden">
                    <StandingsTable rows={standings} limit={5} compact showForm={false} />
                    <div className="border-t border-line p-3">
                      <StandingsLegend />
                    </div>
                  </div>
                </section>
              ) : null}
              {topScorers.length ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="section-title">{t('competitions.scorers')}</h2>
                    <button
                      type="button"
                      onClick={() => setTab('scorers')}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>
                  <div className="card overflow-hidden">
                    <TopScorersList scorers={topScorers} limit={5} />
                  </div>
                </section>
              ) : null}
              <section className="card p-4">
                <h2 className="section-title mb-3">{t('competitions.overview')}</h2>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('competitions.season')}</dt>
                    <dd className="font-semibold text-white">{competition.season}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('competitions.teams')}</dt>
                    <dd className="font-semibold text-white">{competition.teamCount}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('competitions.matches')}</dt>
                    <dd className="font-semibold text-white">{matches.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t('common.updated')}</dt>
                    <dd className="font-semibold text-white">{formatDateLong(new Date())}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        ) : null}

        {tab === 'table' ? (
          <div className="card overflow-hidden">
            <StandingsTable rows={standings} />
            <div className="border-t border-line p-3">
              <StandingsLegend />
            </div>
          </div>
        ) : null}

        {tab === 'bracket' ? (
          <div className="card p-4 sm:p-5">
            <Bracket bracket={query.data.bracket || []} />
          </div>
        ) : null}

        {tab === 'fixtures' ? (
          upcoming.length ? (
            <div className="card divide-y divide-line overflow-hidden">
              {upcoming.map((match) => (
                <MatchRow key={match.id} match={match} showVenue />
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

        {tab === 'scorers' ? (
          topScorers.length ? (
            <div className="card overflow-hidden">
              <TopScorersList scorers={topScorers} />
            </div>
          ) : (
            <EmptyState title={t('players.noPlayers')} />
          )
        ) : null}

        {tab === 'squad' ? (
          nationalSquad.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nationalSquad.map((player) => (
                <PlayerCard key={player.id} player={player} team={player.team} />
              ))}
            </div>
          ) : (
            <EmptyState title={t('teams.noSquad')} />
          )
        ) : null}
      </Container>
    </>
  )
}
