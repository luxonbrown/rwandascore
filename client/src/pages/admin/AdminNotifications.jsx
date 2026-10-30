import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, MessageSquare, Send } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getAdminManagerMessages, replyToManagerMessage } from '../../services/api'

function messageTeam(description = '') {
  return description.match(/^\[([^\]]+)\]/)?.[1] || 'Unassigned club'
}

export default function AdminNotifications() {
  useDocumentTitle('Team manager notifications')
  const client = useQueryClient()
  const messagesQuery = useQuery({ queryKey: ['admin', 'manager-messages'], queryFn: getAdminManagerMessages, refetchInterval: 30000 })
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState('')
  const reply = useMutation({
    mutationFn: ({ id, message }) => replyToManagerMessage(id, message),
    onSuccess: (_response, variables) => { setDrafts((current) => ({ ...current, [variables.id]: '' })); setError(''); client.invalidateQueries({ queryKey: ['admin', 'manager-messages'] }) },
    onError: (cause) => setError(cause.message),
  })
  const messages = messagesQuery.data || []

  return <>
    <AdminPageHeader title="Team manager notifications" subtitle="Read club manager messages and reply directly to the sender" />
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      {error ? <p role="alert" className="rounded-lg border border-negative/30 bg-negative/10 p-3 text-sm text-negative">{error}</p> : null}
      {messagesQuery.error ? <p role="alert" className="text-sm text-negative">{messagesQuery.error.message}</p> : null}
      {messagesQuery.isLoading ? <section className="card p-5 text-sm text-muted">Loading notifications…</section> : messages.length ? messages.map((message) => <article key={message.id} className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Bell size={18}/></span><div><h2 className="font-bold text-white">{message.user}</h2><p className="mt-1 text-xs text-muted">{messageTeam(message.description)} · {new Date(message.createdAt).toLocaleString()}</p></div></div>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">Manager message</span>
        </div>
        <div className="space-y-3 p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{message.body}</p>
          {message.replies?.length ? <div className="space-y-2 border-l-2 border-accent/40 pl-4">{message.replies.map((item) => <div key={item.id} className="rounded-lg bg-surface2 p-3"><div className="flex justify-between gap-2"><p className="text-xs font-semibold text-accent">Reply from {item.user}</p><time className="text-[10px] text-muted">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-white">{item.description}</p></div>)}</div> : null}
          <form className="border-t border-line pt-4" onSubmit={(event) => { event.preventDefault(); const text = (drafts[message.id] || '').trim(); if (text) reply.mutate({ id: message.id, message: text }) }}>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted"><MessageSquare size={14}/> Reply to {message.user}</label>
            <textarea className="input min-h-20 w-full" maxLength={2000} value={drafts[message.id] || ''} onChange={(event) => setDrafts({ ...drafts, [message.id]: event.target.value })} placeholder="Write a response…" />
            <div className="mt-2 flex justify-end"><button className="btn btn-accent" disabled={reply.isPending || !(drafts[message.id] || '').trim()}><Send size={14}/>{reply.isPending ? 'Sending…' : 'Send reply'}</button></div>
          </form>
        </div>
      </article>) : <section className="card p-10 text-center"><Bell size={24} className="mx-auto text-muted"/><h2 className="mt-3 font-bold text-white">No notifications yet</h2><p className="mt-1 text-sm text-muted">Messages from team managers will appear here.</p></section>}
    </div>
  </>
}
