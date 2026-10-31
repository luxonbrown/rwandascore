import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, UsersRound } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ManagerLineupModal from '../../components/admin/ManagerLineupModal'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useI18n } from '../../hooks/useI18n'
import { getManagedMatches, getManagedPlayers, getManagedTeam, updateManagedMatchLineup } from '../../services/api'

export default function ManagerLineups() {
  const { t } = useI18n()
  useDocumentTitle('Team line-ups')
  const client = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const teamQuery = useQuery({ queryKey: ['manager','team'], queryFn: getManagedTeam })
  const matchesQuery = useQuery({ queryKey: ['manager','matches'], queryFn: getManagedMatches })
  const playersQuery = useQuery({ queryKey: ['manager','players'], queryFn: getManagedPlayers })
  const save = useMutation({ mutationFn: ({matchId,version,lineup})=>updateManagedMatchLineup(matchId,version,lineup), onSuccess:()=>{setSelected(null);setError('');client.invalidateQueries({queryKey:['manager','matches']});client.invalidateQueries({queryKey:['matches']})}, onError:(cause)=>setError(cause.message||'Could not save line-up.') })
  const team=teamQuery.data
  const matches=matchesQuery.data||[]
  const upcoming=matches.filter(match=>match.status==='UPCOMING')
  return <>
    <AdminPageHeader title="Team line-ups" subtitle="Choose the starting eleven and substitutes for your assigned club in upcoming fixtures."/>
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      {error?<p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p>:null}
      {!teamQuery.isLoading&&!team?<p className="card p-5 text-sm text-muted">No club is assigned to your account.</p>:null}
      {matchesQuery.isLoading?<div className="card p-5 text-sm text-muted">Loading fixtures…</div>:matchesQuery.error?<p role="alert" className="card p-5 text-sm text-negative">{matchesQuery.error.message}</p>:upcoming.length?<div className="space-y-3">{upcoming.map(match=>{const side=match.homeTeamId===team?.id?'home':'away';const hasSaved=Boolean(match.lineups?.[side]?.rows?.length);return <article key={match.id} className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><CalendarDays size={18}/></span><div className="min-w-0"><p className="truncate font-bold text-white">{match.homeTeam?.name} <span className="text-muted">vs</span> {match.awayTeam?.name}</p><p className="mt-1 text-xs text-muted">{match.competition?.shortName||match.competition?.name||'Competition'} · {match.date?new Date(match.date).toLocaleString():'Date pending'}</p></div></div><div className="flex items-center gap-3"><span className="text-[10px] font-bold uppercase text-accent">{hasSaved?'Line-up submitted':'Line-up needed'}</span><button type="button" className="btn btn-accent" disabled={!team||playersQuery.isLoading} onClick={()=>setSelected(match)}><UsersRound size={15}/>{t('admin.fixtures.manageLineups')}</button></div></article>})}</div>:<section className="card p-8 text-center"><CalendarDays size={24} className="mx-auto text-muted"/><h2 className="mt-3 font-bold text-white">No upcoming fixtures</h2><p className="mt-1 text-sm text-muted">Upcoming matches for {team?.name||'your assigned club'} will appear here.</p></section>}
    </div>
    {selected&&team?<ManagerLineupModal match={selected} team={team} players={playersQuery.data||[]} isPending={save.isPending} onClose={()=>setSelected(null)} onSave={(lineup)=>save.mutate({matchId:selected.id,version:selected.version,lineup})}/>:null}
  </>
}
