import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchX, Sparkles, Trophy } from 'lucide-react'
import Container from '../components/ui/Container'
import PageHeader from '../components/ui/PageHeader'
import SearchField from '../components/ui/SearchField'
import MatchRow from '../components/matches/MatchRow'
import TeamCard from '../components/teams/TeamCard'
import PlayerCard from '../components/players/PlayerCard'
import ArticleCard from '../components/news/ArticleCard'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { CardGridSkeleton, MatchListSkeleton } from '../components/ui/Skeletons'
import { useSearch } from '../hooks/useData'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'

export default function Search() {
  const { t } = useI18n()
  useDocumentTitle(t('search.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') || '')
  const debounced = useDebounce(value, 300)
  const query = useSearch(debounced)
  const results = query.data
  const active = debounced.trim().length >= 2
  const total = results
    ? results.teams.length +
      results.players.length +
      results.matches.length +
      results.competitions.length +
      results.news.length
    : 0

  useEffect(() => {
    const current = searchParams.get('q') || ''
    if (debounced.trim() === current) return
    if (debounced.trim()) {
      setSearchParams({ q: debounced.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [debounced, searchParams, setSearchParams])

  const suggestions = useMemo(
    () => [
      t('search.suggestionApr'),
      t('search.suggestionRayon'),
      t('search.suggestionAmavubi'),
      t('search.suggestionPeaceCup'),
      t('search.suggestionScorers'),
    ],
    [t],
  )

  return (
    <>
      <PageHeader eyebrow={t('nav.search')} title={t('search.title')} subtitle={t('search.promptBody')} />

      <Container className="py-7">
        <SearchField
          value={value}
          onChange={setValue}
          placeholder={t('search.placeholder')}
          className="mx-auto max-w-2xl"
          autoFocus
        />

        {!active ? (
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Sparkles size={14} className="text-accent" />
              {t('search.recent')}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setValue(suggestion)}
                  className="rounded-full border border-line bg-surface2 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="mt-10 text-center text-sm text-muted">
              <p className="font-semibold text-white">{t('search.prompt')}</p>
              <p className="mt-1 text-xs">{t('search.promptBody')}</p>
            </div>
          </div>
        ) : query.isLoading ? (
          <div className="mt-8 space-y-8">
            <CardGridSkeleton count={4} />
            <MatchListSkeleton count={3} />
          </div>
        ) : query.isError ? (
          <div className="mt-8">
            <ErrorState error={query.error} onRetry={query.refetch} />
          </div>
        ) : total === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={SearchX}
              title={t('search.noResults', { query: debounced.trim() })}
              body={t('search.noResultsBody')}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-9">
            {results.teams.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('search.teams')}</h2>
                  <span className="text-[11px] text-muted">{results.teams.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.teams.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </section>
            ) : null}

            {results.players.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('search.players')}</h2>
                  <span className="text-[11px] text-muted">{results.players.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.players.map((player) => (
                    <PlayerCard key={player.id} player={player} team={player.team} />
                  ))}
                </div>
              </section>
            ) : null}

            {results.matches.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('search.matches')}</h2>
                  <span className="text-[11px] text-muted">{results.matches.length}</span>
                </div>
                <div className="card divide-y divide-line overflow-hidden">
                  {results.matches.slice(0, 8).map((match) => (
                    <MatchRow key={match.id} match={match} showDate />
                  ))}
                </div>
              </section>
            ) : null}

            {results.competitions.length ? (
              <section>
                <h2 className="section-title mb-3">{t('search.competitions')}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.competitions.map((competition) => (
                    <Link
                      key={competition.id}
                      to={`/competitions/${competition.id}`}
                      className="card flex items-center gap-3 p-4 transition-colors hover:border-white/15"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-black text-white"
                        style={{ backgroundColor: competition.color }}
                      >
                        <Trophy size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{competition.name}</p>
                        <p className="text-[11px] text-muted">{competition.season}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {results.news.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">{t('search.news')}</h2>
                  <Link to="/news" className="text-[11px] font-semibold text-muted hover:text-accent">
                    {t('common.viewAll')}
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.news.slice(0, 6).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </Container>
    </>
  )
}
