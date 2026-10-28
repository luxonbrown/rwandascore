import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Shield, Trash2, Users } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { createManagedPlayer, deleteManagedPlayer, getManagedPlayers, getManagedTeam, updateManagedPlayer, updateManagedTeam } from '../../services/api'

const blankPlayer = { name: '', position: 'MF', number: '', nationality: 'Rwanda' }

export default function ManagerDashboard() {
  useDocumentTitle('Team manager workspace')
  const client = useQueryClient()
  const teamQuery = useQuery({ queryKey: ['manager', 'team'], queryFn: getManagedTeam })
  const playersQuery = useQuery({ queryKey: ['manager', 'players'], queryFn: getManagedPlayers })
  const [player, setPlayer] = useState(null)
  const [teamForm, setTeamForm] = useState(null)
  const [error, setError] = useState('')
  const refresh = () => client.invalidateQueries({ queryKey: ['manager'] })
  const savePlayer = useMutation({ mutationFn: (value) => value.id ? updateManagedPlayer(value.id, value) : createManagedPlayer(value), onSuccess: () => { setPlayer(null); setError(''); refresh() }, onError: (e) => setError(e.message) })
  const removePlayer = useMutation({ mutationFn: deleteManagedPlayer, onSuccess: refresh, onError: (e) => setError(e.message) })
  const saveTeam = useMutation({ mutationFn: updateManagedTeam, onSuccess: () => { setTeamForm(null); setError(''); refresh() }, onError: (e) => setError(e.message) })
  const team = teamQuery.data
  const players = playersQuery.data || []
  return <>
    <AdminPageHeader title="Team manager workspace" subtitle="Manage your team registration and player roster" />
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {error ? <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p> : null}
      {(teamQuery.error || playersQuery.error) ? <p role="alert" className="text-sm text-negative">{teamQuery.error?.message || playersQuery.error?.message}</p> : null}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Shield size={26}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-muted">Assigned team</p><h2 className="mt-1 text-2xl font-black text-white">{team?.name || (teamQuery.isLoading ? 'Loading team…' : 'No team assigned')}</h2><p className="mt-1 text-sm text-muted">{team?.city}{team?.coach ? ` · Coach ${team.coach}` : ''}</p></div></div>
          {team ? <button className="btn btn-secondary" onClick={() => { setTeamForm({ name: team.name || '', shortName: team.shortName || '', initials: team.initials || '', city: team.city || '', nickname: team.nickname || '', coach: team.coach || '', description: team.description || '' }); setError('') }}><Pencil size={15}/> Edit registration</button> : null}
        </div>
        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase text-muted">Team</p><p className="mt-1 text-sm font-semibold text-white">{team?.shortName || '—'} <span className="text-muted">({team?.initials || '—'})</span></p></div><div><p className="text-[10px] font-bold uppercase text-muted">Home ground</p><p className="mt-1 text-sm font-semibold text-white">{team?.stadium || 'Not registered'}</p></div><div><p className="text-[10px] font-bold uppercase text-muted">Founded</p><p className="mt-1 text-sm font-semibold text-white">{team?.founded || '—'}</p></div></div>
      </section>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><div className="flex items-center gap-2"><Users size={17} className="text-accent"/><h2 className="font-bold text-white">Player roster</h2></div><p className="mt-1 text-xs text-muted">You can only add and manage players registered to your assigned team.</p></div><button className="btn btn-accent" onClick={() => { setPlayer({ ...blankPlayer }); setError('') }} disabled={!team}><Plus size={16}/> Add player</button></div>
        {playersQuery.isLoading ? <p className="p-5 text-sm text-muted">Loading roster…</p> : players.length ? <div className="divide-y divide-line">{players.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold text-white">{item.name}</p><p className="mt-1 text-xs text-muted">{item.position} · {item.number ? `#${item.number} · ` : ''}{item.nationality || 'Rwanda'}</p></div><div className="flex gap-1"><button className="rounded p-2 text-muted hover:bg-hover hover:text-white" aria-label={`Edit ${item.name}`} onClick={() => { setPlayer({ name: item.name, position: item.position, number: item.number || '', nationality: item.nationality || 'Rwanda', id: item.id }); setError('') }}><Pencil size={15}/></button><button className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative" aria-label={`Remove ${item.name}`} onClick={() => { if (window.confirm(`Remove ${item.name} from your team roster?`)) removePlayer.mutate(item.id) }}><Trash2 size={15}/></button></div></div>)}</div> : <p className="p-5 text-sm text-muted">No players are registered to this team yet.</p>}
      </section>
    </div>
    {player ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="presentation"><form className="card w-full max-w-lg space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); savePlayer.mutate({ ...player, number: player.number === '' ? null : Number(player.number) }) }}><div><h2 className="text-lg font-bold text-white">{player.id ? 'Edit player' : 'Add player'}</h2><p className="mt-1 text-xs text-muted">Roster changes apply only to {team?.name}.</p></div><label className="block"><span className="label">Player name *</span><input className="input" required minLength={2} value={player.name} onChange={(e) => setPlayer({ ...player, name: e.target.value })}/></label><div className="grid grid-cols-2 gap-3"><label><span className="label">Position</span><select className="input" value={player.position} onChange={(e) => setPlayer({ ...player, position: e.target.value })}>{['GK','DF','MF','FW'].map((x) => <option key={x}>{x}</option>)}</select></label><label><span className="label">Squad number</span><input className="input" type="number" min="0" max="99" value={player.number} onChange={(e) => setPlayer({ ...player, number: e.target.value })}/></label></div><label className="block"><span className="label">Nationality</span><input className="input" value={player.nationality} onChange={(e) => setPlayer({ ...player, nationality: e.target.value })}/></label><div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setPlayer(null)}>Cancel</button><button className="btn btn-accent" disabled={savePlayer.isPending}>{savePlayer.isPending ? 'Saving…' : 'Save player'}</button></div></form></div> : null}
    {teamForm ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="presentation"><form className="card w-full max-w-lg space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); saveTeam.mutate(teamForm) }}><div><h2 className="text-lg font-bold text-white">Team registration</h2><p className="mt-1 text-xs text-muted">Update the public registration details for your assigned team.</p></div>{[['name','Team name'],['shortName','Short name'],['initials','Initials'],['city','City'],['nickname','Nickname'],['coach','Head coach']].map(([key,label]) => <label key={key} className="block"><span className="label">{label}</span><input className="input" value={teamForm[key]} onChange={(e) => setTeamForm({ ...teamForm, [key]: e.target.value })}/></label>)}<div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setTeamForm(null)}>Cancel</button><button className="btn btn-accent" disabled={saveTeam.isPending}>{saveTeam.isPending ? 'Saving…' : 'Save registration'}</button></div></form></div> : null}
  </>
}
