import { useMemo, useState } from 'react'
import { CalendarDays, RotateCcw, Trophy } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import DateStrip from '../components/ui/DateStrip'
import MatchRow from '../components/matches/MatchRow'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/ui/Skeletons'
import { useCompetitions, useMatches, useTeams } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { dayKeyOf, formatDateLong, todayKey } from '../utils/format'

export default function Results() {
  const { t } = useI18n()
  useDocumentTitle(t('results.title'))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [competition, setCompetition] = useState('all')
  const [teamId, setTeamId] = useState('all')

  const date = dayKeyOf(selectedDate)
  const competitionsQuery = useCompetitions()
  const teamsQuery = useTeams({ competitionId: 'rwanda-premier-league' })
  const matchesQuery = useMatches({
    date,
    status: 'FT',
    ...(competition !== 'all' ? { competitionId: competition } : {}),
    ...(teamId !== 'all' ? { teamId } : {}),
    order: 'asc',
  })

  const matches = useMemo(() => matchesQuery.data || [], [matchesQuery.data])
  const groups = useMemo(() => {
    const map = new Map()
    matches.forEach((match) => {
      if (!map.has(match.competitionId)) map.set(match.competitionId, [])
      map.get(match.competitionId).push(match)
    })
    return [...map.values()]
  }, [matches])

  return (
    <>
      <PageHeader
        eyebrow={t('results.finalScore')}
        title={t('results.title')}
        subtitle={t('results.subtitle')}
        actions={
          <button type="button" onClick={() => setSelectedDate(new Date())} className="btn btn-secondary">
            <CalendarDays size={15} />
            {t('fixtures.jumpToday')}
          </button>
        }
      />

      <Container className="py-7">
        <div className="card p-4">
          <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="label">{t('nav.competitions')}</span>
              <select
                value={competition}
                onChange={(event) => setCompetition(event.target.value)}
                className="input text-sm"
              >
                <option value="all">{t('live.allCompetitions')}</option>
                {(competitionsQuery.data || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">{t('fixtures.team')}</span>
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="input text-sm"
              >
                <option value="all">{t('fixtures.allTeams')}</option>
                {(teamsQuery.data || []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            {competition !== 'all' || teamId !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setCompetition('all')
                  setTeamId('all')
                }}
                className="btn btn-ghost self-end text-xs"
              >
                <RotateCcw size={14} />
                {t('common.clearFilters')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="section-title">{formatDateLong(selectedDate)}</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            {matches.length} {t('common.matches')}
            {date === todayKey() ? ` · ${t('common.today')}` : ''}
          </p>
        </div>

        <div className="mt-3 space-y-5">
          {matchesQuery.isLoading ? (
            <div className="card overflow-hidden">
              <MatchListSkeleton count={6} />
            </div>
          ) : matchesQuery.isError ? (
            <ErrorState error={matchesQuery.error} onRetry={matchesQuery.refetch} />
          ) : groups.length ? (
            groups.map((group) => {
              const competitionData = group[0].competition
              return (
                <section key={competitionData?.id || group[0].competitionId} className="card overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-line bg-surface2/50 px-4 py-2.5">
                    <Trophy size={13} className="text-muted" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      {competitionData?.name || group[0].competitionId}
                    </h3>
                  </div>
                  <div className="divide-y divide-line">
                    {group.map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </div>
                </section>
              )
            })
          ) : (
            <EmptyState
              icon={Trophy}
              title={t('results.noResults')}
              body={t('results.noResultsBody')}
            />
          )}
        </div>
      </Container>
    </>
  )
}
