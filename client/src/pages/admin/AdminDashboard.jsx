import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Newspaper,
  Radio,
  RefreshCw,
  RotateCcw,
  Shield,
  Trophy,
  UserCog,
  Users,
} from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import TeamCrest from '../../components/ui/TeamCrest'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAdminDashboard, useResetDemoData } from '../../hooks/useAdmin'
import { useI18n } from '../../hooks/useI18n'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAuthStore } from '../../store/auth'
import { useUiStore } from '../../store/ui'
import { cn } from '../../utils/cn'
import { formatTimeAgo } from '../../utils/format'
import { initialsOf } from '../../utils/media'
import { siteConfig } from '../../config'

const statCards = [
  { key: 'teams', label: 'admin.statsTeams', icon: Shield, to: '/admin/teams' },
  { key: 'players', label: 'admin.statsPlayers', icon: Users, to: '/admin/players' },
  { key: 'fixtures', label: 'admin.statsFixtures', icon: CalendarDays, to: '/admin/fixtures' },
  { key: 'live', label: 'admin.statsLive', icon: Radio, to: '/admin/live' },
  { key: 'news', label: 'admin.statsArticles', icon: Newspaper, to: '/admin/news' },
  { key: 'users', label: 'admin.statsEditors', icon: UserCog, to: '/admin/users' },
]

export default function AdminDashboard() {
  const { t } = useI18n()
  useDocumentTitle(t('admin.dashboard'))
  const user = useAuthStore((state) => state.user)
  const pushToast = useUiStore((state) => state.pushToast)
  const dashboardQuery = useAdminDashboard({ refetchInterval: 30000 })
  const resetDemo = useResetDemoData()
  const [resetOpen, setResetOpen] = useState(false)
  const data = dashboardQuery.data

  if (dashboardQuery.isError) {
    return (
      <>
        <AdminPageHeader title={t('admin.dashboard')} subtitle={t('admin.dashboardSubtitle')} />
        <div className="p-4 sm:p-6 lg:p-8">
          <ErrorState error={dashboardQuery.error} onRetry={dashboardQuery.refetch} />
        </div>
      </>
    )
  }

  const handleReset = async () => {
    try {
      await resetDemo.mutateAsync()
      setResetOpen(false)
      pushToast(t('admin.resetDone'))
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  return (
    <>
      <AdminPageHeader
        title={t('admin.dashboard')}
        subtitle={t('admin.welcome', { name: user?.name?.split(' ')[0] || user?.name })}
        actions={
          <>
            <button
              type="button"
              onClick={() => dashboardQuery.refetch()}
              className="btn btn-secondary"
              disabled={dashboardQuery.isFetching}
            >
              <RefreshCw size={15} className={dashboardQuery.isFetching ? 'animate-spin' : ''} />
              {t('admin.refresh')}
            </button>
            <button type="button" onClick={() => setResetOpen(true)} className="btn btn-ghost">
              <RotateCcw size={15} />
              {t('admin.demoReset')}
            </button>
          </>
        }
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {dashboardQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="card space-y-3 p-4">
                <span className="skeleton block h-8 w-8 rounded-lg" />
                <span className="skeleton block h-6 w-14" />
                <span className="skeleton block h-3 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.key} to={card.to} className="card card-hover p-4">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon size={17} />
                  </span>
                  <p className="text-2xl font-extrabold text-white">
                    {data?.counts?.[card.key] ?? 0}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {t(card.label)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}

        {data?.managerMessages?.length ? (
          <section className="card overflow-hidden border border-accent/30">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <div className="flex items-center gap-2"><Bell size={16} className="text-accent" /><h2 className="section-title">Team manager notifications</h2></div>
              <Link to="/admin/notifications" className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{data.managerMessages.length} recent · Open inbox</Link>
            </div>
            <ul className="divide-y divide-line">
              {data.managerMessages.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-white">{item.user}</p><time className="shrink-0 text-[10px] text-muted">{formatTimeAgo(item.createdAt, t)}</time></div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{item.description.replace(/^\[[^\]]+\]\s*/, '')}</p>
                  {item.recordId ? <p className="mt-1 text-[10px] text-muted">Club: {item.description.match(/^\[([^\]]+)\]/)?.[1] || 'Assigned club'}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-accent" />
                  <h2 className="section-title">{t('admin.liveNow')}</h2>
                </div>
                <Link to="/admin/live" className="link-muted">
                  {t('admin.openLive')}
                </Link>
              </div>
              {data?.liveMatches?.length ? (
                <div className="divide-y divide-line">
                  {data.liveMatches.map((match) => (
                    <Link
                      key={match.id}
                      to="/admin/live"
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-hover/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {match.homeTeam?.name} <span className="text-muted">vs</span>{' '}
                          {match.awayTeam?.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {match.competition?.shortName || match.competition?.name}
                          {match.round ? ` · ${match.round}` : ''}
                        </p>
                      </div>
                      <span className="text-lg font-extrabold tabular-nums text-white">
                        {match.homeScore}–{match.awayScore}
                      </span>
                      <StatusBadge status={match.status} minute={match.minute} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Radio}
                  title={t('admin.noLive')}
                  className="border-0 bg-transparent py-10"
                />
              )}
            </section>

            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-accent" />
                  <h2 className="section-title">{t('admin.recentActivity')}</h2>
                </div>
                <Link to="/admin/activity" className="link-muted">
                  {t('common.viewAll')}
                </Link>
              </div>
              {data?.activity?.length ? (
                <ul className="divide-y divide-line">
                  {data.activity.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold text-white">
                        {initialsOf(item.user)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white">
                          <span className="font-semibold">{item.user}</span>{' '}
                          <span className="text-muted">{item.action.toLowerCase()}</span>{' '}
                          <span className="font-medium">{item.record}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {item.module} · {formatTimeAgo(item.createdAt || Date.now() - (item.minutesAgo || 0) * 60000, t)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t('admin.noActivity')} className="border-0 bg-transparent py-10" />
              )}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="card overflow-hidden">
                <div className="border-b border-line px-4 py-3.5">
                  <h2 className="section-title">{t('admin.table')}</h2>
                </div>
                <ul className="divide-y divide-line">
                  {(data?.topOfTable || []).map((row) => (
                    <li key={row.teamId} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 text-xs font-bold text-muted">{row.position}</span>
                      <TeamCrest team={row.team} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">
                        {row.team?.name}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-accent">{row.points}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/admin/competitions"
                  className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-xs font-semibold text-muted hover:text-accent"
                >
                  {t('competitions.title')}
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="card overflow-hidden">
                <div className="border-b border-line px-4 py-3.5">
                  <h2 className="section-title">{t('admin.latestNews')}</h2>
                </div>
                <ul className="divide-y divide-line">
                  {(data?.latestNews || []).map((article) => (
                    <li key={article.id}>
                      <Link
                        to={`/news/${article.slug}`}
                        className="block px-4 py-2.5 hover:bg-hover/50"
                      >
                        <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-white">
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">{article.category}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/admin/news"
                  className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-xs font-semibold text-muted hover:text-accent"
                >
                  {t('admin.news.title')}
                  <ArrowRight size={13} />
                </Link>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-positive" />
                  <h2 className="section-title">{t('admin.online')}</h2>
                </div>
                <span className="rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-bold text-positive">
                  {data?.presence?.filter((entry) => entry.status === 'online').length || 0} online
                </span>
              </div>
              <ul className="divide-y divide-line">
                {(data?.presence || []).map((entry) => (
                  <li key={entry.userId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold text-white">
                      {initialsOf(entry.name)}
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
                          entry.status === 'online' ? 'bg-positive' : 'bg-muted',
                        )}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{entry.name}</p>
                      <p className="truncate text-[10px] text-muted">{entry.workingOn}</p>
                    </div>
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-muted">
                      {entry.screen}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-4">
              <h2 className="section-title mb-3">{t('admin.quickActions')}</h2>
              <div className="grid gap-2">
                <Link to="/admin/fixtures?new=1" className="btn btn-secondary justify-start">
                  <CalendarDays size={15} />
                  {t('admin.newFixture')}
                </Link>
                <Link to="/admin/news?new=1" className="btn btn-secondary justify-start">
                  <Newspaper size={15} />
                  {t('admin.newArticle')}
                </Link>
                <Link to="/admin/live" className="btn btn-secondary justify-start">
                  <Radio size={15} />
                  {t('admin.openLive')}
                </Link>
                <Link to="/admin/teams" className="btn btn-secondary justify-start">
                  <Trophy size={15} />
                  {t('admin.manageTeams')}
                </Link>
              </div>
            </section>

            <section className="card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Trophy size={15} className="text-accent" />
                <h2 className="section-title">{t('admin.system')}</h2>
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('common.season')}</dt>
                  <dd className="font-semibold text-white">{siteConfig.season}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('common.updated')}</dt>
                  <dd className="font-semibold text-white">
                    {data?.dataUpdatedAt
                      ? formatTimeAgo(data.dataUpdatedAt, t)
                      : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t('admin.today')}</dt>
                  <dd className="font-semibold text-white">
                    {data?.todayMatches?.length || 0} {t('common.matches')}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('admin.resetConfirm')}
        description={t('admin.demoResetBody')}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setResetOpen(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleReset}
              disabled={resetDemo.isPending}
            >
              <RotateCcw size={15} className={resetDemo.isPending ? 'animate-spin' : ''} />
              {resetDemo.isPending ? t('admin.loading') : t('admin.demoReset')}
            </button>
          </>
        }
      >
        <p className="rounded-lg border border-negative/25 bg-negative/5 p-3 text-sm leading-relaxed text-negative">
          {t('admin.resetWarning')}
        </p>
      </Modal>
    </>
  )
}
