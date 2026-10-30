import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Clock3, Radio, Trophy } from 'lucide-react'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import MatchRow from '../components/matches/MatchRow'
import MatchCard from '../components/matches/MatchCard'
import ArticleCard from '../components/news/ArticleCard'
import StandingsTable, { StandingsLegend } from '../components/standings/StandingsTable'
import TopScorersList from '../components/players/TopScorersList'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useCompetitions, useLiveMatches, useMatches, useNews, useStandings, useTopScorers } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { todayKey } from '../utils/format'

const competitionLabels = {
  league: 'competitions.league',
  cup: 'competitions.cup',
  national: 'competitions.national',
}

const accents = ['#FF6B00', '#38BDF8', '#22C55E']

export default function Home() {
  const { t } = useI18n()
  useDocumentTitle()
  const today = todayKey()
  const liveQuery = useLiveMatches()
  const matchesQuery = useMatches({ date: today, order: 'asc' })
  const standingsQuery = useStandings('rwanda-premier-league')
  const scorersQuery = useTopScorers('rwanda-premier-league', 5)
  const newsQuery = useNews({ limit: 6 })
  const competitionsQuery = useCompetitions()

  const liveMatches = liveQuery.data || []
  const todaysMatches = matchesQuery.data || []
  const news = newsQuery.data || []
  const featured = news.find((article) => article.featured) || news[0]
  const secondaryNews = news.filter((article) => article.id !== featured?.id).slice(0, 3)
  const heroMatch = liveMatches[0] || todaysMatches.find((match) => match.status === 'UPCOMING')
  const nextUp = todaysMatches.filter((match) => match.status === 'UPCOMING').slice(0, 3)

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,107,0,0.13),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.07),transparent_30%)]" />
        <Container className="relative grid gap-8 py-9 sm:py-12 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
              <span className="h-px w-6 bg-accent" />
              {t('home.eyebrow')}
            </p>
            <h1 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t('home.title')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              {t('home.subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link to="/live" className="btn btn-accent">
                <Radio size={16} />
                {liveMatches.length
                  ? t('home.liveCount', { count: liveMatches.length })
                  : t('live.title')}
              </Link>
              <Link to="/fixtures" className="btn btn-secondary">
                <CalendarDays size={16} />
                {t('home.viewFixtures')}
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
              <Clock3 size={12} />
              {t('home.heroNote')}
            </p>
          </div>

          <div className="relative">
            <div className="absolute -right-3 -top-3 hidden h-24 w-24 rounded-full border border-accent/10 sm:block" />
            {heroMatch ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                    {heroMatch.status === 'UPCOMING' ? t('home.nextUp') : t('home.liveNow')}
                    {heroMatch.status === 'LIVE' ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
                    ) : null}
                  </span>
                  <span className="text-[10px] font-semibold text-accent">
                    {t('common.season')} 2025/26
                  </span>
                </div>
                <MatchCard match={heroMatch} />
              </div>
            ) : (
              <div className="card p-5">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Trophy size={19} />
                </span>
                <h2 className="text-base font-bold text-white">{t('home.noLive')}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">{t('home.noLiveBody')}</p>
                <Link to="/fixtures" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                  {t('home.viewFixtures')}
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {(competitionsQuery.data || []).map((competition, index) => (
            <Link
              key={competition.id}
              to={`/competitions/${competition.id}`}
              className="card group flex items-center gap-3 p-4 transition-colors hover:border-white/15"
            >
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-black"
                style={{ backgroundColor: competition.color, color: competition.secondaryColor || '#fff' }}
              >
                {competition.logoText || competition.shortName}
                {competition.logoUrl ? <img src={competition.logoUrl} alt="" className="absolute inset-0 z-10 h-full w-full bg-surface object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white group-hover:text-accent">
                  {competition.shortName}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {t(competitionLabels[competition.type] || 'competitions.competitions')}
                  <span className="mx-1">·</span>
                  {competition.season}
                </p>
              </div>
              <span
                className="h-8 w-1 shrink-0 rounded-full opacity-60"
                style={{ backgroundColor: accents[index % accents.length] }}
              />
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <div className="min-w-0 space-y-8">
            <section>
              <SectionHeading title={t('home.liveNow')} href="/live" linkLabel={t('home.followLive')} />
              <div className="card overflow-hidden">
                {liveQuery.isLoading ? (
                  <MatchListSkeleton count={2} />
                ) : liveQuery.isError ? (
                  <ErrorState error={liveQuery.error} onRetry={liveQuery.refetch} />
                ) : liveMatches.length ? (
                  <div className="divide-y divide-line">
                    {liveMatches.slice(0, 4).map((match) => (
                      <MatchRow key={match.id} match={match} showDate />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Radio}
                    title={t('home.noLive')}
                    body={t('home.noLiveBody')}
                    className="border-0 bg-transparent py-10"
                    action={
                      <Link to="/fixtures" className="btn btn-secondary">
                        {t('home.viewFixtures')}
                      </Link>
                    }
                  />
                )}
              </div>
            </section>

            <section>
              <SectionHeading
                title={t('home.todayMatches')}
                href="/fixtures"
                linkLabel={t('home.allMatches')}
              />
              <div className="card overflow-hidden">
                {matchesQuery.isLoading ? (
                  <MatchListSkeleton count={6} />
                ) : matchesQuery.isError ? (
                  <ErrorState error={matchesQuery.error} onRetry={matchesQuery.refetch} />
                ) : todaysMatches.length ? (
                  <div className="divide-y divide-line">
                    {todaysMatches.map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title={t('common.noMatches')} className="border-0 bg-transparent" />
                )}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-8">
            <section>
              <SectionHeading
                title={t('home.leagueTable')}
                href="/tables"
                linkLabel={t('home.viewTables')}
              />
              <div className="card overflow-hidden">
                {standingsQuery.isLoading ? (
                  <MatchListSkeleton count={5} />
                ) : standingsQuery.isError ? (
                  <ErrorState error={standingsQuery.error} onRetry={standingsQuery.refetch} />
                ) : (
                  <>
                    <StandingsTable rows={standingsQuery.data || []} limit={6} compact showForm={false} />
                    <div className="border-t border-line px-3 py-3">
                      <StandingsLegend />
                    </div>
                  </>
                )}
              </div>
            </section>

            <section>
              <SectionHeading
                title={t('home.topScorers')}
                href="/players"
                linkLabel={t('common.viewAll')}
              />
              <div className="card overflow-hidden">
                {scorersQuery.isLoading ? (
                  <MatchListSkeleton count={5} />
                ) : scorersQuery.isError ? (
                  <ErrorState error={scorersQuery.error} onRetry={scorersQuery.refetch} />
                ) : (
                  <TopScorersList scorers={scorersQuery.data || []} limit={5} />
                )}
              </div>
            </section>

            {nextUp.length ? (
              <section>
                <SectionHeading title={t('home.nextUp')} href="/fixtures" linkLabel={t('common.viewAll')} />
                <div className="card divide-y divide-line overflow-hidden">
                  {nextUp.map((match) => (
                    <MatchRow key={match.id} match={match} showDate />
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </Container>

      <section className="border-y border-line bg-surface/25 py-9">
        <Container>
          <SectionHeading
            title={t('home.latestNews')}
            href="/news"
            linkLabel={t('home.readStories')}
          />
          {newsQuery.isLoading ? (
            <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
              <div className="skeleton min-h-[340px] rounded-card" />
              <MatchListSkeleton count={3} />
            </div>
          ) : newsQuery.isError ? (
            <ErrorState error={newsQuery.error} onRetry={newsQuery.refetch} />
          ) : featured ? (
            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
              <ArticleCard article={featured} variant="featured" />
              <div className="card divide-y divide-line overflow-hidden bg-surface">
                {secondaryNews.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="compact" className="m-1.5" />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title={t('news.noArticles')} />
          )}
        </Container>
      </section>
    </>
  )
}
