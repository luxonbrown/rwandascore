import { Link } from 'react-router-dom'
import { Shield, Target, TrendingUp } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import StandingsTable, { StandingsLegend } from '../components/standings/StandingsTable'
import TopScorersList from '../components/players/TopScorersList'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useStandings, useTopScorers } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

export default function Tables() {
  const { t } = useI18n()
  useDocumentTitle(t('tables.title'))
  const standingsQuery = useStandings('rwanda-premier-league')
  const scorersQuery = useTopScorers('rwanda-premier-league', 10)
  const rows = standingsQuery.data || []
  const leader = rows[0]
  const bestAttack = [...rows].sort((a, b) => b.gf - a.gf)[0]
  const bestDefence = [...rows].sort((a, b) => a.ga - b.ga)[0]

  return (
    <>
      <PageHeader
        eyebrow={`2025/26 · ${t('competitions.rpl')}`}
        title={t('tables.title')}
        subtitle={t('tables.subtitle')}
        actions={
          <Link to="/competitions/rwanda-premier-league" className="btn btn-secondary">
            <Shield size={15} />
            {t('competitions.viewCompetition')}
          </Link>
        }
      />

      <Container className="py-7">
        {rows.length ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <TrendingUp size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t('tables.leader')}
                </p>
                <p className="truncate text-sm font-bold text-white">{leader?.team?.name}</p>
                <p className="text-[11px] text-accent">
                  {leader?.points} {t('standings.points')}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                <Target size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t('tables.bestAttack')}
                </p>
                <p className="truncate text-sm font-bold text-white">{bestAttack?.team?.name}</p>
                <p className="text-[11px] text-muted">
                  {bestAttack?.gf} {t('standings.gf')}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10 text-positive">
                <Shield size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {t('tables.bestDefence')}
                </p>
                <p className="truncate text-sm font-bold text-white">{bestDefence?.team?.name}</p>
                <p className="text-[11px] text-muted">
                  {bestDefence?.ga} {t('standings.ga')}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="card overflow-hidden">
              {standingsQuery.isLoading ? (
                <MatchListSkeleton count={8} />
              ) : standingsQuery.isError ? (
                <ErrorState error={standingsQuery.error} onRetry={standingsQuery.refetch} />
              ) : (
                <StandingsTable rows={rows} />
              )}
              <div className="border-t border-line p-3">
                <StandingsLegend />
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{t('standings.updatedNote')}</p>
          </div>

          <aside>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">{t('home.topScorers')}</h2>
              <Link to="/players" className="text-xs font-semibold text-muted hover:text-accent">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="card overflow-hidden">
              {scorersQuery.isLoading ? (
                <MatchListSkeleton count={6} />
              ) : scorersQuery.isError ? (
                <ErrorState error={scorersQuery.error} onRetry={scorersQuery.refetch} />
              ) : (
                <TopScorersList scorers={scorersQuery.data || []} limit={7} />
              )}
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
