import { useState } from 'react'
import { Shield } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import SearchField from '../components/ui/SearchField'
import TeamCard from '../components/teams/TeamCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeletons'
import { useTeams } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

export default function Teams() {
  const { t } = useI18n()
  useDocumentTitle(t('teams.title'))
  const [search, setSearch] = useState('')
  const teamsQuery = useTeams({ competitionId: 'rwanda-premier-league' })
  const q = search.trim().toLowerCase()
  const teams = (teamsQuery.data || []).filter((team) =>
    q ? [team.name, team.shortName, team.city, team.stadium, team.nickname].join(' ').toLowerCase().includes(q) : true,
  )

  return (
    <>
      <PageHeader
        eyebrow="2025/26"
        title={t('teams.title')}
        subtitle={t('teams.subtitle')}
        actions={<SearchField value={search} onChange={setSearch} placeholder={t('teams.searchPlaceholder')} className="w-full sm:w-72" />}
      />

      <Container className="py-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {teams.length} {t('competitions.teams')}
          </p>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <Shield size={12} />
            {t('competitions.rpl')}
          </span>
        </div>

        {teamsQuery.isLoading ? (
          <CardGridSkeleton count={8} />
        ) : teamsQuery.isError ? (
          <ErrorState error={teamsQuery.error} onRetry={teamsQuery.refetch} />
        ) : teams.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title={t('teams.noTeams')}
            body={t('teams.noTeamsBody')}
            action={
              <button type="button" onClick={() => setSearch('')} className="btn btn-secondary">
                {t('common.clear')}
              </button>
            }
          />
        )}
      </Container>
    </>
  )
}
