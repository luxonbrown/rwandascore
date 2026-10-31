import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Pencil, Shield, Users } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getManagedTeam, updateManagedTeam } from '../../services/api'

const empty = { name: '', shortName: '', initials: '', city: '', nickname: '', coach: '', founded: '', logoUrl: '', primaryColor: '#FF6B00', secondaryColor: '#121212', description: '' }

export default function ManagerTeam() {
  useDocumentTitle('Manage my club')
  const client = useQueryClient()
  const teamQuery = useQuery({ queryKey: ['manager', 'team'], queryFn: getManagedTeam })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const save = useMutation({
    mutationFn: updateManagedTeam,
    onSuccess: (team) => { client.setQueryData(['manager', 'team'], team); setEditing(false); setError('') },
    onError: (cause) => setError(cause.message || 'Could not save club details.'),
  })
  const team = teamQuery.data
  const beginEdit = () => {
    setForm({ ...empty, ...team, founded: team?.founded || '', logoUrl: team?.logoUrl || '' })
    setError('')
    setEditing(true)
  }

  return <>
    <AdminPageHeader title="Manage my club" subtitle="Update the public details for your assigned club and manage its squad and line-ups." actions={team ? <button className="btn btn-accent" onClick={beginEdit}><Pencil size={15}/>Edit club</button> : null}/>
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {teamQuery.isLoading ? <div className="card p-6 text-sm text-muted">Loading assigned club…</div> : teamQuery.error ? <div role="alert" className="card p-5 text-sm text-negative">{teamQuery.error.message}</div> : !team ? <div className="card p-5 text-sm text-muted">No club is assigned to your account. Ask an administrator to assign one.</div> : <>
        {error ? <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p> : null}
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-accent/10 text-accent">{team.logoUrl ? <img src={team.logoUrl} alt={`${team.name} crest`} className="h-full w-full object-contain"/> : <Shield size={28}/>}</span>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-muted">Your assigned club</p><h2 className="mt-1 text-2xl font-black text-white">{team.name}</h2><p className="mt-1 text-sm text-muted">{team.city || 'City not registered'} · {team.coach || 'Coach not registered'}</p></div>
            <div className="flex gap-2"><Link to="/manager/players" className="btn btn-secondary"><Users size={15}/>Manage players</Link><Link to="/manager/lineups" className="btn btn-secondary">Manage line-ups<ArrowRight size={14}/></Link></div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase text-muted">Short name</p><p className="mt-1 text-sm font-semibold text-white">{team.shortName || '—'} ({team.initials || '—'})</p></div><div><p className="text-[10px] font-bold uppercase text-muted">Home ground</p><p className="mt-1 text-sm font-semibold text-white">{team.stadium || 'Not registered'}</p></div><div><p className="text-[10px] font-bold uppercase text-muted">Founded</p><p className="mt-1 text-sm font-semibold text-white">{team.founded || '—'}</p></div></div>
          {team.description ? <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">{team.description}</p> : null}
        </section>
        <section className="card p-5"><h2 className="font-bold text-white">Manager permissions</h2><p className="mt-1 text-sm leading-relaxed text-muted">You can update your assigned club’s profile, manage its players, and submit the line-up for your club in upcoming matches. Other clubs, match scores, live events, and user accounts remain outside your access.</p></section>
      </>}
    </div>

    {editing ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4"><form className="card my-auto w-full max-w-3xl space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); save.mutate({ name: form.name, shortName: form.shortName, initials: form.initials, city: form.city, nickname: form.nickname || null, coach: form.coach || null, founded: form.founded === '' ? null : Number(form.founded), logoUrl: form.logoUrl.trim() || null, primaryColor: form.primaryColor, secondaryColor: form.secondaryColor, description: form.description || null }) }}><div><h2 className="text-lg font-bold text-white">Edit club profile</h2><p className="mt-1 text-xs text-muted">Changes apply only to your assigned club.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['name','Club name','text'],['shortName','Short name','text'],['initials','Initials','text'],['city','City','text'],['nickname','Nickname','text'],['coach','Head coach','text'],['founded','Founded year','number'],['logoUrl','Logo image URL','url']].map(([key,label,type])=><label key={key} className="block"><span className="label">{label}</span><input className="input" type={type} min={type==='number'?1900:undefined} max={type==='number'?2100:undefined} value={form[key] ?? ''} onChange={(event)=>setForm({...form,[key]:event.target.value})}/></label>)}</div><label className="block"><span className="label">Description</span><textarea className="input min-h-24" value={form.description || ''} onChange={(event)=>setForm({...form,description:event.target.value})}/></label><div className="grid gap-3 sm:grid-cols-2">{[['primaryColor','Primary color'],['secondaryColor','Secondary color']].map(([key,label])=><label key={key} className="block"><span className="label">{label}</span><input className="input h-11" type="color" value={form[key]} onChange={(event)=>setForm({...form,[key]:event.target.value})}/></label>)}</div>{error?<p role="alert" className="text-sm text-negative">{error}</p>:null}<div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button><button className="btn btn-accent" disabled={save.isPending}>{save.isPending?'Saving…':'Save club'}</button></div></form></div>:null}
  </>
}
