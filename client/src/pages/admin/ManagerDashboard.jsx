import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, MessageSquare, Pencil, Send, Shield, Users } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getManagedMatches, getManagedPlayers, getManagedTeam, getManagerMessages, sendManagerMessage, updateManagedTeam } from '../../services/api'

export default function ManagerDashboard() {
  useDocumentTitle('Team manager workspace')
  const client = useQueryClient()
  const teamQuery = useQuery({ queryKey: ['manager', 'team'], queryFn: getManagedTeam })
  const playersQuery = useQuery({ queryKey: ['manager', 'players'], queryFn: getManagedPlayers })
  const matchesQuery = useQuery({ queryKey: ['manager', 'matches'], queryFn: getManagedMatches })
  const messagesQuery = useQuery({ queryKey: ['manager', 'messages'], queryFn: getManagerMessages, refetchInterval: 30000 })
  const [teamForm, setTeamForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const saveTeam = useMutation({ mutationFn: updateManagedTeam, onSuccess: () => { setTeamForm(null); setError(''); client.invalidateQueries({ queryKey: ['manager'] }) }, onError: (cause) => setError(cause.message) })
  const sendMessage = useMutation({ mutationFn: sendManagerMessage, onSuccess: () => { setMessage(''); setError('') }, onError: (cause) => setError(cause.message) })
  const team = teamQuery.data
  const players = playersQuery.data || []
  const matches = matchesQuery.data || []
  const messages = messagesQuery.data || []

  return <>
    <AdminPageHeader title="Team manager workspace" subtitle="Manage your club information, view team matches, and contact the administrator" />
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {error ? <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p> : null}
      {(teamQuery.error || playersQuery.error || matchesQuery.error) ? <p role="alert" className="text-sm text-negative">{teamQuery.error?.message || playersQuery.error?.message || matchesQuery.error?.message}</p> : null}
      {!team && !teamQuery.isLoading && !teamQuery.error ? <section className="card border border-accent/30 p-5"><h2 className="font-bold text-white">No club is assigned to your account</h2><p className="mt-1 text-sm text-muted">An administrator must assign one club in Admin → Users before team and roster controls become available. You can request an assignment below.</p></section> : null}

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Shield size={26}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-muted">Assigned club</p><h2 className="mt-1 text-2xl font-black text-white">{team?.name || (teamQuery.isLoading ? 'Loading club…' : 'No club assigned')}</h2><p className="mt-1 text-sm text-muted">{team?.city}{team?.coach ? ` · Coach ${team.coach}` : ''}</p></div></div>
          {team ? <button className="btn btn-secondary" onClick={() => { setTeamForm({ name: team.name || '', shortName: team.shortName || '', initials: team.initials || '', city: team.city || '', nickname: team.nickname || '', coach: team.coach || '', founded: team.founded || '', logoUrl: team.logoUrl || '', primaryColor: team.primaryColor || '#FF6B00', secondaryColor: team.secondaryColor || '#121212', description: team.description || '' }); setError('') }}><Pencil size={15}/> Edit club</button> : null}
        </div>
        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase text-muted">Club</p><p className="mt-1 text-sm font-semibold text-white">{team?.shortName || '—'} <span className="text-muted">({team?.initials || '—'})</span></p></div><div><p className="text-[10px] font-bold uppercase text-muted">Home ground</p><p className="mt-1 text-sm font-semibold text-white">{team?.stadium || 'Not registered'}</p></div><div><p className="text-[10px] font-bold uppercase text-muted">Founded</p><p className="mt-1 text-sm font-semibold text-white">{team?.founded || '—'}</p></div></div>
      </section>

      <Link to="/manager/players" className="card card-hover flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Users size={20}/></span><div className="min-w-0 flex-1"><h2 className="font-bold text-white">Player management</h2><p className="mt-1 text-xs text-muted">View and manage your club’s roster</p></div><span className="text-sm font-semibold text-accent">{players.length} players</span><ArrowRight size={17} className="text-muted"/></Link>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line p-5"><CalendarDays size={17} className="text-accent"/><div><h2 className="font-bold text-white">Team fixtures and results</h2><p className="mt-1 text-xs text-muted">Read-only match information for {team?.name || 'your assigned club'}.</p></div></div>
        {matchesQuery.isLoading ? <p className="p-5 text-sm text-muted">Loading team matches…</p> : matches.length ? <div className="divide-y divide-line">{matches.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-white">{match.homeTeam?.name} <span className="text-muted">vs</span> {match.awayTeam?.name}</p><p className="mt-1 text-xs text-muted">{match.competition?.shortName || match.competition?.name || 'Competition'} · {match.date ? new Date(match.date).toLocaleString() : 'Date pending'}</p></div><div className="text-right"><p className="font-bold tabular-nums text-white">{match.homeScore}–{match.awayScore}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-accent">{match.status}</p></div></div>)}</div> : <p className="p-5 text-sm text-muted">No fixtures or results are registered for your club.</p>}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2"><MessageSquare size={17} className="text-accent"/><h2 className="font-bold text-white">Message the administrator</h2></div>
        <p className="mb-3 text-xs text-muted">Your message will appear as a notification on the Admin dashboard.</p>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (message.trim()) sendMessage.mutate(message.trim()) }}><textarea className="input min-h-24 w-full" maxLength={2000} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask for a club assignment or send an update…"/><div className="flex justify-end"><button className="btn btn-accent" disabled={sendMessage.isPending || !message.trim()}><Send size={15}/>{sendMessage.isPending ? 'Sending…' : 'Send message'}</button></div></form>
      </section>
      {messages.length ? <section className="card overflow-hidden"><div className="border-b border-line p-5"><h2 className="font-bold text-white">Your messages and replies</h2><p className="mt-1 text-xs text-muted">Administrator responses appear here.</p></div><div className="divide-y divide-line">{messages.map((item) => <article key={item.id} className="space-y-3 p-5"><p className="whitespace-pre-wrap text-sm text-white">{item.body}</p>{item.replies?.map((response) => <div key={response.id} className="rounded-lg border-l-2 border-accent bg-surface2 p-3"><p className="text-xs font-semibold text-accent">Reply from {response.user}</p><p className="mt-1 whitespace-pre-wrap text-sm text-white">{response.description}</p></div>)}</article>)}</div></section> : null}
    </div>

    {teamForm ? <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="presentation"><form className="card my-auto w-full max-w-2xl space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); saveTeam.mutate({ ...teamForm, founded: teamForm.founded === '' ? null : Number(teamForm.founded), logoUrl: teamForm.logoUrl.trim() || null }) }}><div><h2 className="text-lg font-bold text-white">Club registration</h2><p className="mt-1 text-xs text-muted">Update the public registration details for your assigned club.</p></div><div className="grid gap-3 sm:grid-cols-2">{[['name','Club name'],['shortName','Short name'],['initials','Initials'],['city','City'],['nickname','Nickname'],['coach','Head coach'],['founded','Founded year'],['logoUrl','Logo URL']].map(([key,label]) => <label key={key} className="block"><span className="label">{label}</span><input className="input" type={key === 'founded' ? 'number' : 'text'} min={key === 'founded' ? 1900 : undefined} max={key === 'founded' ? 2100 : undefined} value={teamForm[key]} onChange={(event) => setTeamForm({ ...teamForm, [key]: event.target.value })}/></label>)}</div><label className="block"><span className="label">Description</span><textarea className="input min-h-20" value={teamForm.description} onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })}/></label><div className="grid gap-3 sm:grid-cols-2">{[['primaryColor','Primary color'],['secondaryColor','Secondary color']].map(([key,label]) => <label key={key} className="block"><span className="label">{label}</span><input className="input h-11" type="color" value={teamForm[key]} onChange={(event) => setTeamForm({ ...teamForm, [key]: event.target.value })}/></label>)}</div><div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setTeamForm(null)}>Cancel</button><button className="btn btn-accent" disabled={saveTeam.isPending}>{saveTeam.isPending ? 'Saving…' : 'Save club'}</button></div></form></div> : null}
  </>
}
