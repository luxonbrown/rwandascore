import { useState } from 'react'
import { Search, SlidersHorizontal, UserRound } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import SearchField from '../components/ui/SearchField'
import Pagination from '../components/ui/Pagination'
import PlayerCard from '../components/players/PlayerCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeletons'
import { usePlayers, useTeams } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { useDebounce } from '../hooks/useDebounce'

const positions = [
  { value: 'ALL', label: 'players.allPositions' },
  { value: 'GK', label: 'players.goalkeeper' },
  { value: 'DF', label: 'players.defender' },
  { value: 'MF', label: 'players.midfielder' },
  { value: 'FW', label: 'players.forward' },
]

const sorters = [
  { value: 'goals', label: 'players.sortGoals' },
  { value: 'assists', label: 'players.sortAssists' },
  { value: 'appearances', label: 'players.sortAppearances' },
  { value: 'name', label: 'players.sortName' },
  { value: 'age', label: 'players.sortAge' },
]

export default function Players() {
  const { t } = useI18n()
  useDocumentTitle(t('players.title'))
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('ALL')
  const [teamId, setTeamId] = useState('ALL')
  const [sort, setSort] = useState('goals')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 250)
  const teamsQuery = useTeams({ competitionId: 'rwanda-premier-league' })
  const playersQuery = usePlayers({
    search: debouncedSearch,
    position,
    ...(teamId !== 'ALL' ? { teamId } : {}),
    sort,
    page,
    pageSize: 12,
  })

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const data = playersQuery.data
  const items = data?.items || []

  return (
    <>
      <PageHeader
        eyebrow={t('nav.players')}
        title={t('players.title')}
        subtitle={t('players.subtitle')}
        actions={<SearchField value={search} onChange={updateFilter(setSearch)} placeholder={t('players.searchPlaceholder')} className="w-full sm:w-72" />}
      />

      <Container className="py-7">
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted sm:flex">
              <SlidersHorizontal size={12} />
              {t('players.position')}
            </span>
            {positions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => updateFilter(setPosition)(item.value)}
                aria-pressed={position === item.value}
                className={
                  position === item.value
                    ? 'rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-ink'
                    : 'rounded-full border border-line bg-surface2 px-3 py-1 text-[11px] font-semibold text-muted hover:text-white'
                }
              >
                {t(item.label)}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t('players.team')}</span>
              <select
                value={teamId}
                onChange={(event) => updateFilter(setTeamId)(event.target.value)}
                className="input text-sm"
              >
                <option value="ALL">{t('players.allTeams')}</option>
                {(teamsQuery.data || []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">{t('players.sortName')}</span>
              <select
                value={sort}
                onChange={(event) => updateFilter(setSort)(event.target.value)}
                className="input text-sm"
              >
                {sorters.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-muted">
            {data ? `${data.total} ${t('nav.players')}` : t('common.loading')}
          </p>
          {data && data.totalPages > 1 ? (
            <p className="text-[11px] text-muted">
              {t('common.page')} {data.page} {t('common.of')} {data.totalPages}
            </p>
          ) : null}
        </div>

        <div className="mt-3">
          {playersQuery.isLoading ? (
            <CardGridSkeleton count={8} />
          ) : playersQuery.isError ? (
            <ErrorState error={playersQuery.error} onRetry={playersQuery.refetch} />
          ) : items.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((player) => (
                  <PlayerCard key={player.id} player={player} team={player.team} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={(value) => {
                  setPage(value)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-7"
              />
            </>
          ) : (
            <EmptyState
              icon={search ? Search : UserRound}
              title={t('players.noPlayers')}
              body={t('players.noPlayersBody')}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setPosition('ALL')
                    setTeamId('ALL')
                    setPage(1)
                  }}
                  className="btn btn-secondary"
                >
                  {t('common.clearFilters')}
                </button>
              }
            />
          )}
        </div>
      </Container>
    </>
  )
}
