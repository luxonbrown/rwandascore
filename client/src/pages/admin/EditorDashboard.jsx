import { Link } from 'react-router-dom'
import { Radio, ArrowUpRight, Activity, CalendarPlus, CalendarDays, Newspaper, Shield, Trophy, Users, Upload, History } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useAdminCollection } from '../../hooks/useAdmin'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const workspaces = [
  { title: 'Competitions & seasons', to: '/admin/competitions', icon: Trophy },
  { title: 'Teams & stadiums', to: '/admin/teams', icon: Shield },
  { title: 'Players', to: '/admin/players', icon: Users },
  { title: 'Fixture schedule', to: '/admin/fixtures', icon: CalendarDays },
  { title: 'Live match reporting', to: '/admin/live', icon: Radio },
  { title: 'News publishing', to: '/admin/news', icon: Newspaper },
  { title: 'Media library', to: '/admin/uploads', icon: Upload },
  { title: 'Activity log', to: '/admin/activity', icon: History },
]

export default function EditorDashboard() {
  useDocumentTitle('Live desk')
  const matches = useAdminCollection('fixtures', { refetchInterval: 10000 })
  const live = (matches.data || []).filter((match) => ['LIVE', 'HT'].includes(match.status))
  const clockAlerts = live.filter((match) => match.clock?.awaitingStoppage || match.clock?.awaitingFullTime)
  const upcoming = (matches.data || []).filter((match) => match.status === 'UPCOMING').slice(0, 5)
  return <>
    <AdminPageHeader title="Match operations" subtitle="Prepare Rwanda fixtures, then cover every match live" />
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="card flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wider text-accent">EDITOR workspace</p><h2 className="mt-2 text-2xl font-black text-white">Own the match report from kickoff to full time</h2><p className="mt-2 max-w-xl text-sm text-muted">Prepare the fixture in advance. During play, publish goals, cards, substitutions, shots, pitch locations and timeline updates to the public match page.</p></div>
        <div className="flex shrink-0 flex-wrap gap-2"><Link className="btn btn-secondary" to="/admin/fixtures?new=1"><CalendarPlus size={16}/> Prepare fixture</Link><Link className="btn btn-accent" to="/admin/live"><Radio size={16}/> Live desk <ArrowUpRight size={15}/></Link></div>
      </section>
      {matches.error ? <p role="alert" className="text-sm text-negative">{matches.error.message}</p> : null}
      {clockAlerts.length ? <section className="card overflow-hidden border border-accent/40"><div className="border-b border-line p-4"><h2 className="font-bold text-white">Live clock alerts</h2><p className="mt-1 text-xs text-muted">A match clock paused and needs your stoppage-time or period-end decision.</p></div><div className="divide-y divide-line">{clockAlerts.map((match) => <Link key={match.id} to={`/admin/live?matchId=${match.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-hover"><span><span className="block text-sm font-semibold text-white">{match.homeTeam?.name} vs {match.awayTeam?.name}</span><span className="mt-1 block text-xs text-muted">{match.clock.period === 1 ? 'First half reached 45 minutes' : `Second half paused at ${match.minute} minutes`}</span></span><span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Open · {match.minute}&apos;</span></Link>)}</div></section> : null}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><Activity size={15} className="text-negative"/> Matches live</div><p className="mt-3 text-3xl font-black text-white">{live.length}</p><p className="mt-1 text-xs text-muted">Active matches available to report</p></div>
        <div className="card p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><Radio size={15} className="text-accent"/> Scheduled</div><p className="mt-3 text-3xl font-black text-white">{upcoming.length}</p><p className="mt-1 text-xs text-muted">Next fixtures in the queue</p></div>
      </section>
      <section><div className="mb-3"><h2 className="font-bold text-white">Your admin workspaces</h2><p className="mt-1 text-xs text-muted">Full access to football operations and published content.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{workspaces.map(({ title, to, icon: Icon }) => <Link key={to} to={to} className="card card-hover flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon size={18}/></span><span className="text-sm font-semibold text-white">{title}</span><ArrowUpRight size={15} className="ml-auto shrink-0 text-muted"/></Link>)}</div></section>
      <section className="grid gap-5 xl:grid-cols-2"><div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-line p-5"><div><div className="flex items-center gap-2"><Activity size={15} className="text-negative"/><h2 className="font-bold text-white">Live matches</h2></div><p className="mt-1 text-xs text-muted">Open the desk to publish a live update.</p></div><Link to="/admin/live" className="link-muted">Live desk</Link></div>{live.length ? <div className="divide-y divide-line">{live.map((match) => <Link key={match.id} to="/admin/live" className="flex items-center justify-between gap-3 p-4 hover:bg-hover"><span className="font-semibold text-white">{match.homeTeam?.name} <span className="text-accent">{match.homeScore}–{match.awayScore}</span> {match.awayTeam?.name}</span><span className="text-xs font-bold uppercase text-negative">{match.minute || 0}&apos;</span></Link>)}</div> : <p className="p-5 text-sm text-muted">No matches are live right now.</p>}</div><div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-line p-5"><div><div className="flex items-center gap-2"><CalendarDays size={15} className="text-accent"/><h2 className="font-bold text-white">Upcoming fixtures</h2></div><p className="mt-1 text-xs text-muted">Review and prepare match details before kickoff.</p></div><Link to="/admin/fixtures" className="link-muted">All fixtures</Link></div>{upcoming.length ? <div className="divide-y divide-line">{upcoming.map((match) => <Link key={match.id} to="/admin/fixtures" className="flex items-center justify-between gap-3 p-4 hover:bg-hover"><span className="min-w-0"><span className="block truncate font-semibold text-white">{match.homeTeam?.name} vs {match.awayTeam?.name}</span><span className="mt-1 block text-xs text-muted">{match.competition?.shortName || match.competition?.name}</span></span><span className="shrink-0 text-right text-xs text-muted">{new Date(match.date).toLocaleDateString()}<br/>{new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></Link>)}</div> : <p className="p-5 text-sm text-muted">No scheduled fixtures. Create one for the next match day.</p>}</div></section>
    </div>
  </>
}
