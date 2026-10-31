import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, Footprints, Ruler, ShieldCheck, Square } from 'lucide-react'
import Container from '../components/ui/Container'
import TeamCrest from '../components/ui/TeamCrest'
import FavouriteButton from '../components/ui/FavouriteButton'
import PlayerCard from '../components/players/PlayerCard'
import PlayerPitch from '../components/players/PlayerPitch'
import ErrorState from '../components/ui/ErrorState'
import { usePlayer } from '../hooks/useData'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useI18n } from '../hooks/useI18n'
import { positionKey } from '../utils/media'
import PlayerAvatar from '../components/players/PlayerAvatar'

const statKeys = [
  ['appearances', 'players.appearances'],
  ['goals', 'players.goals'],
  ['assists', 'players.assists'],
  ['yellowCards', 'players.yellowCards'],
  ['redCards', 'players.redCards'],
]

export default function PlayerDetail() {
  const { id } = useParams()
  const { t } = useI18n()
  const query = usePlayer(id)
  const player = query.data?.player
  useDocumentTitle(player?.name)

  if (query.isLoading) {
    return (
      <Container className="py-10">
        <div className="skeleton mb-6 h-52 rounded-card" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-28 rounded-card" />
          ))}
        </div>
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

  const { team, teammates, scorerRank, recentEvents = [] } = query.data
  const primary = team?.colors?.primary || '#1E1E1E'
  const secondary = team?.colors?.secondary || '#FFFFFF'
  const isGoalkeeper = player.position === 'GK'

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,107,0,0.12),transparent_40%)]" />
        <Container className="relative py-7">
          <Link
            to="/players"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white"
          >
            <ArrowLeft size={14} />
            {t('players.title')}
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative flex h-32 w-28 shrink-0 items-end justify-center overflow-hidden rounded-2xl pb-3 shadow-lift" style={{ backgroundColor: primary, color: secondary }}>
              <PlayerAvatar player={player} className="absolute inset-0 h-full w-full" fallbackClassName="text-4xl font-black" />
              <span className="relative z-10 rounded-lg bg-black/55 px-2 text-3xl font-black">#{player.number ?? '—'}</span>
              <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
              <span className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-black/10" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                {t(positionKey(player.position))}
                {player.captain ? (
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] text-accent">
                    {t('players.captain') || 'Captain'}
                  </span>
                ) : null}
                {player.nationalTeam ? (
                  <span className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] text-muted">
                    {t('competitions.amavubi')}
                  </span>
                ) : null}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{player.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                {team ? (
                  <Link to={`/teams/${team.id}`} className="inline-flex items-center gap-1.5 hover:text-white">
                    <TeamCrest team={team} size="xs" />
                    {team.name}
                  </Link>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  {player.nationality}
                </span>
                {scorerRank ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Award size={12} />
                    {t('players.scorerRank', { rank: scorerRank })}
                  </span>
                ) : null}
              </div>
            </div>
            <FavouriteButton kind="player" id={player.id} />
          </div>
        </Container>
      </section>

      <Container className="py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <section>
              <h2 className="section-title mb-2.5">{t('players.seasonStats')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statKeys.map(([key, label]) => (
                  <div key={key} className="card p-4">
                    <p className="text-2xl font-extrabold text-white">{player.stats?.[key] ?? 0}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t(label)}
                    </p>
                  </div>
                ))}
                {isGoalkeeper ? (
                  <div className="card p-4">
                    <p className="text-2xl font-extrabold text-accent">{player.stats?.cleanSheets ?? 0}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t('players.cleanSheets')}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            {recentEvents.length ? (
              <section className="card p-5">
                <h2 className="section-title mb-3">{t('players.recentMatchEvents') || 'Recent match events'}</h2>
                <ul className="divide-y divide-line">
                  {recentEvents.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="flex min-w-0 items-start gap-2">
                        {event.type === 'red' || event.type === 'yellow' ? (
                          <Square size={13} fill="currentColor" className={`mt-0.5 shrink-0 ${event.type === 'red' ? 'text-red-500' : 'text-yellow-400'}`} />
                        ) : null}
                        <span className={`min-w-0 truncate ${event.type === 'red' ? 'font-bold text-red-400' : 'text-white'}`}>
                          {event.type === 'yellow' ? t('match.yellow') : event.type === 'red' ? t('match.red') : event.type === 'substitution' ? t('match.sub') : event.type}
                          {event.related ? ' · ' + (t('players.substitutedOff') || 'substituted off') : ''}
                          {event.match ? <span className="block truncate text-xs text-muted">{event.match}</span> : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-muted">{event.minute}&apos;</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="card p-5">
              <h2 className="section-title mb-2">{t('players.bio')}</h2>
              <p className="text-sm leading-relaxed text-white/70">{player.bio?.trim() || 'No biography has been added for this player yet.'}</p>
            </section>

            {teammates.length ? (
              <section>
                <div className="mb-2.5 flex items-center justify-between">
                  <h2 className="section-title">{t('players.teammates')}</h2>
                  {team ? (
                    <Link
                      to={`/teams/${team.id}?tab=squad`}
                      className="text-xs font-semibold text-muted hover:text-accent"
                    >
                      {t('teams.squad')}
                    </Link>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {teammates.map((item) => (
                    <PlayerCard key={item.id} player={item} team={item.team} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <PlayerPitch featuredPlayer={player} team={team} title={t('players.pitchPosition')} compact />
            <section className="card p-4">
              <h2 className="section-title mb-3">{t('players.profile')}</h2>
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted">
                    <Award size={12} /> {t('players.shirtNumber')}
                  </dt>
                  <dd className="font-bold text-white">#{player.number}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('players.position')}</dt>
                  <dd className="font-semibold text-white">{t(positionKey(player.position))}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('players.age')}</dt>
                  <dd className="font-semibold text-white">{player.age}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('players.nationality')}</dt>
                  <dd className="font-semibold text-white">{player.nationality}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted">
                    <Ruler size={12} /> {t('players.height')}
                  </dt>
                  <dd className="font-semibold text-white">{player.height} cm</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted">
                    <Footprints size={12} /> {t('players.foot')}
                  </dt>
                  <dd className="font-semibold text-white">
                    {t(player.foot === 'Left' ? 'players.left' : 'players.right')}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </Container>
    </>
  )
}
