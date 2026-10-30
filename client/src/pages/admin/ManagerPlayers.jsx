import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { createManagedPlayer, deleteManagedPlayer, getManagedPlayers, getManagedTeam, updateManagedPlayer } from '../../services/api'

const blankPlayer = { name: '', position: 'MF', number: '', nationality: 'Rwanda' }

export default function ManagerPlayers() {
  useDocumentTitle('Team player roster')
  const client = useQueryClient()
  const teamQuery = useQuery({ queryKey: ['manager', 'team'], queryFn: getManagedTeam })
  const playersQuery = useQuery({ queryKey: ['manager', 'players'], queryFn: getManagedPlayers })
  const [player, setPlayer] = useState(null)
  const [error, setError] = useState('')
  const refresh = () => client.invalidateQueries({ queryKey: ['manager', 'players'] })
  const savePlayer = useMutation({
    mutationFn: (value) => value.id
      ? updateManagedPlayer(value.id, value)
      : createManagedPlayer(value),
    onSuccess: () => { setPlayer(null); setError(''); refresh() },
    onError: (cause) => setError(cause.message),
  })
  const removePlayer = useMutation({
    mutationFn: deleteManagedPlayer,
    onSuccess: refresh,
    onError: (cause) => setError(cause.message),
  })
  const team = teamQuery.data
  const players = playersQuery.data || []

  return <>
    <AdminPageHeader title="Player roster" subtitle={team ? `Manage players registered to ${team.name}` : 'Manage players registered to your assigned club'} />
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {error ? <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p> : null}
      {(teamQuery.error || playersQuery.error) ? <p role="alert" className="text-sm text-negative">{teamQuery.error?.message || playersQuery.error?.message}</p> : null}
      {!team && !teamQuery.isLoading && !teamQuery.error ? <section className="card border border-accent/30 p-5"><h2 className="font-bold text-white">No club is assigned to your account</h2><p className="mt-1 text-sm text-muted">Ask an administrator to assign one club before managing its player roster.</p></section> : null}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <div className="flex items-center gap-2"><Users size={18} className="text-accent"/><div><h2 className="font-bold text-white">{team?.name || 'Team'} roster</h2><p className="mt-1 text-xs text-muted">Changes are limited to your assigned club.</p></div></div>
          <button className="btn btn-accent" onClick={() => { setPlayer({ ...blankPlayer }); setError('') }} disabled={!team}><Plus size={16}/> Add player</button>
        </div>
        {playersQuery.isLoading ? <p className="p-5 text-sm text-muted">Loading roster…</p> : players.length ? <div className="divide-y divide-line">{players.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold text-white">{item.name}</p><p className="mt-1 text-xs text-muted">{item.position} · {item.number ? `#${item.number} · ` : ''}{item.nationality || 'Rwanda'}</p></div><div className="flex gap-1"><button className="rounded p-2 text-muted hover:bg-hover hover:text-white" aria-label={`Edit ${item.name}`} onClick={() => { setPlayer({ name: item.name, position: item.position, number: item.number || '', nationality: item.nationality || 'Rwanda', id: item.id }); setError('') }}><Pencil size={15}/></button><button className="rounded p-2 text-muted hover:bg-negative/10 hover:text-negative" aria-label={`Remove ${item.name}`} onClick={() => { if (window.confirm(`Remove ${item.name} from your team roster?`)) removePlayer.mutate(item.id) }}><Trash2 size={15}/></button></div></div>)}</div> : <p className="p-5 text-sm text-muted">No players are registered to this team yet.</p>}
      </section>
    </div>
    {player ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" role="presentation"><form className="card w-full max-w-lg space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); savePlayer.mutate({ ...player, number: player.number === '' ? null : Number(player.number) }) }}><div><h2 className="text-lg font-bold text-white">{player.id ? 'Edit player' : 'Add player'}</h2><p className="mt-1 text-xs text-muted">Roster changes apply only to {team?.name}.</p></div><label className="block"><span className="label">Player name *</span><input className="input" required minLength={2} value={player.name} onChange={(event) => setPlayer({ ...player, name: event.target.value })}/></label><div className="grid grid-cols-2 gap-3"><label><span className="label">Position</span><select className="input" value={player.position} onChange={(event) => setPlayer({ ...player, position: event.target.value })}>{['GK','DF','MF','FW'].map((position) => <option key={position}>{position}</option>)}</select></label><label><span className="label">Squad number</span><input className="input" type="number" min="0" max="99" value={player.number} onChange={(event) => setPlayer({ ...player, number: event.target.value })}/></label></div><label className="block"><span className="label">Nationality</span><input className="input" value={player.nationality} onChange={(event) => setPlayer({ ...player, nationality: event.target.value })}/></label><div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setPlayer(null)}>Cancel</button><button className="btn btn-accent" disabled={savePlayer.isPending}>{savePlayer.isPending ? 'Saving…' : 'Save player'}</button></div></form></div> : null}
  </>
}
