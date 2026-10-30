import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDot, Grid2X2, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import SearchField from '../components/ui/SearchField'
import Pagination from '../components/ui/Pagination'
import PlayerCard from '../components/players/PlayerCard'
import PlayerPitch from '../components/players/PlayerPitch'
import TeamCrest from '../components/ui/TeamCrest'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton } from '../components/ui/Skeletons'
import { useAllPlayers, usePlayers, useTeams } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { useDebounce } from '../hooks/useDebounce'
import { positionKey } from '../utils/media'

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
  const [view, setView] = useState('pitch')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 250)
  const teamsQuery = useTeams()
  const allTeamsSelected = teamId === 'ALL'
  const activeView = allTeamsSelected ? 'list' : view
  const playerFilters = {
    search: debouncedSearch,
    ...(position !== 'ALL' ? { position } : {}),
    ...(teamId !== 'ALL' ? { teamId } : {}),
    sort,
  }
  const pagedPlayersQuery = usePlayers({ ...playerFilters, page, pageSize: 12 }, { enabled: activeView === 'cards' })
  const allPlayersQuery = useAllPlayers(playerFilters, { enabled: activeView === 'pitch' || activeView === 'list' })
  const playersQuery = activeView === 'cards' ? pagedPlayersQuery : allPlayersQuery

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const data = playersQuery.data
  const items = data?.items || []
  const teams = teamsQuery.data || []
  const selectedTeam = teams.find((team) => team.id === teamId)
  const pitchPlayers = selectedTeam
    ? items.filter((player) => (player.teamId || player.team?.id) === selectedTeam.id)
    : []
  const pitchSquads = pitchPlayers.length ? [{ team: selectedTeam, players: pitchPlayers }] : []
  const displayedPitchPlayerCount = pitchSquads.reduce((total, squad) => total + squad.players.length, 0)

  return (
    <>
      <PageHeader
        eyebrow={t('nav.players')}
        title={t('players.title')}
        subtitle={t('players.subtitle')}
        actions={<SearchField value={search} onChange={updateFilter(setSearch)} placeholder={t('players.searchPlaceholder')} className="w-full sm:w-72" />}
      />

      <Container className="py-7">
        {teamsQuery.isError ? <div className="mb-4"><ErrorState error={teamsQuery.error} onRetry={teamsQuery.refetch} /></div> : null}
        <div className="card p-4">
          <div className="mb-4 flex justify-end gap-2">
            {allTeamsSelected ? <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 text-xs font-semibold text-accent"><Grid2X2 size={15}/>{t('players.allTeamList')}</span> : <>
              <button type="button" onClick={() => { setView('pitch'); setPage(1) }} aria-pressed={view === 'pitch'} className={`btn ${view === 'pitch' ? 'btn-accent' : 'btn-secondary'}`}><CircleDot size={15}/>{t('players.pitchView')}</button>
              <button type="button" onClick={() => { setView('cards'); setPage(1) }} aria-pressed={view === 'cards'} className={`btn ${view === 'cards' ? 'btn-accent' : 'btn-secondary'}`}><Grid2X2 size={15}/>{t('players.cardsView')}</button>
            </>}
          </div>
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
            {data ? `${activeView === 'pitch' ? displayedPitchPlayerCount : data.total} ${t('nav.players')}` : t('common.loading')}
          </p>
          {activeView === 'cards' && data && data.totalPages > 1 ? (
            <p className="text-[11px] text-muted">
              {t('common.page')} {data.page} {t('common.of')} {data.totalPages}
            </p>
          ) : null}
        </div>

        <div className="mt-3">
          {playersQuery.isLoading || (activeView === 'pitch' && teamsQuery.isLoading) ? (
            <CardGridSkeleton count={8} />
          ) : playersQuery.isError ? (
            <ErrorState error={playersQuery.error} onRetry={playersQuery.refetch} />
          ) : activeView === 'pitch' ? (
            pitchSquads.length ? <div className="space-y-6">{pitchSquads.map((squad) => <PlayerPitch key={squad.team?.id || squad.title} players={squad.players} team={squad.team} title={squad.title || t('players.pitchTitle')} />)}</div> : <EmptyState icon={CircleDot} title={t('players.pitchSelectTeam')} body={t('players.noPlayersBody')} />
          ) : activeView === 'list' ? (
            items.length ? <div className="card divide-y divide-line overflow-hidden">{items.map((player) => <div key={player.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4"><Link to={`/players/${player.id}`} aria-label={player.name} className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface2 text-sm font-black text-white">{(player.faceId || player.photoUrl) ? <img src={player.faceId || player.photoUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }}/> : <span>{player.name?.trim()?.[0]?.toUpperCase() || '?'}</span>}</Link><div className="min-w-0 flex-1"><Link to={`/players/${player.id}`} className="block truncate text-sm font-bold text-white hover:text-accent">{player.name}</Link><div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted">{player.team ? <TeamCrest team={player.team} size="xs"/> : null}<span className="truncate">{player.team?.name || (player.isNationalTeam ? t('players.nationalSquad') : t('players.unassignedPlayers'))}</span><span>·</span><span>{t(positionKey(player.position))}</span></div></div><Link to={`/players/${player.id}`} className="shrink-0 rounded-full border border-line bg-surface2 px-3 py-2 text-xs font-bold text-white hover:border-accent">#{player.number ?? '—'}</Link></div>)}</div> : <EmptyState icon={search ? Search : UserRound} title={t('players.noPlayers')} body={t('players.noPlayersBody')} />
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
