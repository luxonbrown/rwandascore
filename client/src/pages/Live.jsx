import { Link } from 'react-router-dom'
import { Activity, CalendarDays, Radio } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import MatchRow from '../components/matches/MatchRow'
import MatchCard from '../components/matches/MatchCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton, MatchListSkeleton } from '../components/ui/Skeletons'
import { useCompetitions, useLiveMatches, useMatches } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { todayKey } from '../utils/format'
import { cn } from '../utils/cn'
import { useState } from 'react'

export default function Live() {
  const { t } = useI18n()
  useDocumentTitle(t('live.title'))
  const [competition, setCompetition] = useState('all')
  const liveQuery = useLiveMatches()
  const competitionsQuery = useCompetitions()
  const scheduleQuery = useMatches({ date: todayKey(), order: 'asc' })

  const liveMatches = liveQuery.data || []
  const filteredLive =
    competition === 'all'
      ? liveMatches
      : liveMatches.filter((match) => match.competitionId === competition)
  const schedule = (scheduleQuery.data || []).filter(
    (match) => competition === 'all' || match.competitionId === competition,
  )

  return (
    <>
      <PageHeader
        eyebrow={t('nav.live')}
        title={t('live.title')}
        subtitle={t('live.subtitle')}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent">
            <Activity size={13} className="animate-pulse-dot" />
            {t('live.auto')}
          </span>
        }
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCompetition('all')}
            aria-pressed={competition === 'all'}
            className={cn('pill', competition === 'all' ? 'pill-active' : 'pill-idle')}
          >
            {t('live.allCompetitions')}
          </button>
          {(competitionsQuery.data || []).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCompetition(item.id)}
              aria-pressed={competition === item.id}
              className={cn('pill', competition === item.id ? 'pill-active' : 'pill-idle')}
            >
              {item.shortName}
            </button>
          ))}
        </div>
      </PageHeader>

      <Container className="py-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
              {t('home.liveNow')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {liveMatches.length === 1
                ? t('live.inProgressOne')
                : t('live.inProgress', { count: liveMatches.length })}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
            <Radio size={13} />
            {t('home.heroNote')}
          </span>
        </div>

        {liveQuery.isLoading ? (
          <CardGridSkeleton count={2} className="lg:grid-cols-2" />
        ) : liveQuery.isError ? (
          <ErrorState error={liveQuery.error} onRetry={liveQuery.refetch} />
        ) : filteredLive.length ? (
          <div className="live-match-grid grid gap-4 lg:grid-cols-2">
            {filteredLive.map((match, index) => (
              <MatchCard key={match.id} match={match} style={{ animationDelay: `${index * 90}ms` }} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Radio}
            title={t('live.empty')}
            body={t('live.emptyBody')}
            action={
              <Link to="/fixtures" className="btn btn-secondary">
                {t('home.viewFixtures')}
              </Link>
            }
          />
        )}

        <section className="mt-9">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">{t('live.schedule')}</h2>
            <Link
              to="/fixtures"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-accent"
            >
              <CalendarDays size={13} />
              {t('home.viewFixtures')}
            </Link>
          </div>
          <div className="card overflow-hidden">
            {scheduleQuery.isLoading ? (
              <MatchListSkeleton count={6} />
            ) : scheduleQuery.isError ? (
              <ErrorState error={scheduleQuery.error} onRetry={scheduleQuery.refetch} />
            ) : schedule.length ? (
              <div className="divide-y divide-line">
                {schedule.map((match) => (
                  <MatchRow key={match.id} match={match} showDate />
                ))}
              </div>
            ) : (
              <EmptyState title={t('live.noMatchesOnDate')} className="border-0 bg-transparent" />
            )}
          </div>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            {t('live.refreshNote')}
          </p>
        </section>
      </Container>
    </>
  )
}
