import * as mock from './mockApi'

export const isMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const useMock = isMockMode
const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '')
const authKey = 'rwandascore_auth_v1'
export class ApiError extends Error { constructor(message, status = 400, details = undefined, meta = {}) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; Object.assign(this, meta) } }
export function describeApiError(error) { const details = Array.isArray(error?.details) ? error.details : []; const base = details.length ? details.map((detail) => [detail.field, detail.message].filter(Boolean).join(': ')).join(' · ') : error?.message || 'Request failed'; const meta = [error?.prismaCode, error?.requestId].filter(Boolean).join(' · '); return meta ? `${base} (${meta})` : base }
export const LIVE_STATUSES = ['LIVE', 'HT']
export const dayKeyOf = mock.dayKeyOf
export const todayKey = mock.todayKey
let tokens = {}
try { tokens = JSON.parse(localStorage.getItem('rwandascore_tokens') || '{}') } catch { /* empty session */ }
function persistTokens(value) { tokens = value || {}; localStorage.setItem('rwandascore_tokens', JSON.stringify(tokens)) }
function clearLocalAuth() {
  persistTokens({})
  localStorage.removeItem(authKey)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('rwandascore:auth-expired'))
}
function statusName(value) { return ({ scheduled: 'UPCOMING', live: 'LIVE', ht: 'HT', ft: 'FT', postponed: 'POSTPONED', abandoned: 'CANCELLED' })[value] || value }
function matchShape(m) { if (!m) return null; return { ...m, date: m.kickoffAt || m.date, status: statusName(m.status), homeScore: m.homeScore ?? 0, awayScore: m.awayScore ?? 0, homeTeam: m.homeTeam, awayTeam: m.awayTeam, events: (m.events || []).map((e) => ({ ...e, type: e.type === 'penalty' ? 'goal' : e.type === 'substitution' ? 'sub' : e.type, player: e.player || null, playerName: e.playerName || e.player || null, assistName: e.assistName || e.relatedPlayer || null, playerOut: e.type === 'substitution' ? e.relatedPlayer || null : e.playerOut, detail: e.detail || e.note || null })) } }
function unwrap(result) { return Array.isArray(result) ? result : result?.items || [] }
async function request(path, { method = 'GET', body, headers = {}, auth = false } = {}) {
  let response = await fetch(`${base}${path}`, { method, headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(auth && tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}), ...headers }, body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body) })
  if (response.status === 401 && auth && !['/auth/login', '/auth/refresh'].includes(path)) {
    let refreshed = false
    if (tokens.refreshToken) {
      try {
        const refreshResponse = await fetch(`${base}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) })
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
          response = await fetch(`${base}${path}`, { method, headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${tokens.accessToken}`, ...headers }, body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body) })
          refreshed = true
        }
      } catch { /* clear the stale session below */ }
    }
    if (!refreshed || response.status === 401) clearLocalAuth()
  }
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data?.error?.message || data?.message || `Request failed (${response.status})`, response.status, data?.error?.details, { code: data?.error?.code, requestId: data?.error?.requestId, prismaCode: data?.error?.prismaCode })
  return data
}
const qs = (obj = {}) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, Array.isArray(v) ? v.join(',') : String(v)) }); return p.size ? `?${p}` : '' }
const get = (path) => request(path)
const admin = (path, options = {}) => request(`/admin${path}`, { ...options, auth: true })
const manager = (path, options = {}) => request(`/manager${path}`, { ...options, auth: true })
export const getManagedTeam = () => manager('/team')
export const updateManagedTeam = (body) => manager('/team', { method: 'PUT', body })
export const getManagedPlayers = async () => unwrap(await manager('/players'))
export const createManagedPlayer = (body) => manager('/players', { method: 'POST', body })
export const updateManagedPlayer = (id, body) => manager(`/players/${id}`, { method: 'PUT', body })
export const deleteManagedPlayer = (id) => manager(`/players/${id}`, { method: 'DELETE' })
const userPayload = (payload) => {
  const { status, phone: _phone, password, ...fields } = payload
  return { ...fields, ...(password ? { password } : {}), ...(status !== undefined ? { isActive: status === 'Active' } : {}) }
}
const userShape = (user) => ({
  ...user,
  status: user.status || (user.isActive ? 'Active' : 'Inactive'),
  lastActive: user.lastActive || user.lastLoginAt || null,
  phone: user.phone || '',
})
const matchPayload = (payload) => {
  const { date, homeScore: _homeScore, awayScore: _awayScore, ...fields } = payload
  const status = ({ UPCOMING: 'scheduled', LIVE: 'live', HT: 'ht', FT: 'ft', POSTPONED: 'postponed' })[fields.status] || fields.status
  return { ...fields, ...(date ? { kickoffAt: date } : {}), ...(status ? { status } : {}) }
}
const emptyToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value)
const teamPayload = (payload) => {
  const { coach, colors, national, logo, stadium: _stadium, competitionIds: _competitionIds, founded, ...fields } = payload
  const out = { ...fields }
  if (coach !== undefined) out.coach = emptyToNull(typeof coach === 'string' ? coach : coach?.name)
  if (colors !== undefined) {
    if (colors?.primary !== undefined) out.primaryColor = colors.primary
    if (colors?.secondary !== undefined) out.secondaryColor = colors.secondary
  }
  if (national !== undefined) out.isNational = Boolean(national)
  if (logo !== undefined) out.logoUrl = emptyToNull(logo)
  if (founded !== undefined) out.founded = founded === '' || founded === null ? null : Number(founded)
  if (out.stadiumId !== undefined) out.stadiumId = out.stadiumId || null
  return out
}

export async function getMatches(filters = {}) { if (useMock) return mock.getMatches(filters); return unwrap(await get(`/matches${qs({ ...filters, status: Array.isArray(filters.status) ? filters.status.map((s) => s.toLowerCase()).join(',') : filters.status?.toLowerCase() })}`)).map(matchShape) }
export async function getLiveMatches() { if (useMock) return mock.getLiveMatches(); return unwrap(await get('/matches/live')).map(matchShape) }
export async function getMatch(id) { if (useMock) return mock.getMatch(id); return matchShape(await get(`/matches/${id}`)) }
export async function getHeadToHead(a,b,limit=5) { const list = await getMatches({ teamId: a, limit: 100 }); return list.filter(m => [m.homeTeamId,m.awayTeamId].includes(b)).filter(m => m.status === 'FT').slice(0,limit) }
export async function getCompetitions() { if (useMock) return mock.getCompetitions(); return unwrap(await get('/competitions')) }
export async function getCompetition(id) { if (useMock) return mock.getCompetition(id); return get(`/competitions/${id}`) }
export async function getCompetitionData(id) { if (useMock) return mock.getCompetitionData(id); const [competition, matches, standings, scorers] = await Promise.all([getCompetition(id), get(`/competitions/${id}/fixtures`), get(`/competitions/${id}/standings`), get(`/competitions/${id}/top-scorers`)]); return { ...competition, matches: unwrap(matches).map(matchShape), standings: unwrap(standings), topScorers: unwrap(scorers) } }
export async function getStandings(id='rwanda-premier-league') { if (useMock) return mock.getStandings(id); return unwrap(await get(`/competitions/${id}/standings`)) }
export async function getTopScorers(id='rwanda-premier-league',limit=10) { if (useMock) return mock.getTopScorers(id,limit); return unwrap(await get(`/competitions/${id}/top-scorers${qs({limit})}`)) }
export async function getTeams(filters={}) { if (useMock) return mock.getTeams(filters); return unwrap(await get(`/teams${qs({ competitionId: filters.competitionId })}`)) }
export async function getTeamDetail(id) { if (useMock) return mock.getTeamDetail(id); return get(`/teams/${id}`) }
export async function getPlayers(filters={}) { if (useMock) return mock.getPlayers(filters); return unwrap(await get(`/players${qs(filters)}`)) }
export async function getPlayer(id) { if (useMock) return mock.getPlayer(id); return get(`/players/${id}`) }
export async function getNews(filters={}) { if (useMock) return mock.getNews(filters); return unwrap(await get(`/news${qs(filters)}`)) }
export async function getArticle(slug) { if (useMock) return mock.getArticle(slug); return get(`/news/${slug}`) }
export async function searchAll(query) { if (useMock) return mock.searchAll(query); return get(`/search${qs({q:query})}`) }
export async function getFavouritesData(filters={}) { if (useMock) return mock.getFavouritesData(filters); const [teams, players] = await Promise.all([getTeams(), getPlayers()]); return { teams: teams.filter(x => filters.teamIds?.includes(x.id)), players: players.filter(x => filters.playerIds?.includes(x.id)) } }
export async function login(email,password) { if (useMock) return mock.login(email,password); const data=await request('/auth/login',{method:'POST',body:{email:email.trim(),password}}); persistTokens({accessToken:data.accessToken,refreshToken:data.refreshToken}); return { user:data.user, token:data.accessToken } }
export async function changePassword(currentPassword,newPassword) { if (useMock) return { success:true }; return request('/auth/change-password',{method:'POST',auth:true,body:{currentPassword,newPassword}}) }
export async function getUserById(id) { if (useMock) return mock.getUserById(id); const data=await request('/auth/me',{auth:true}); return data.user?.id===id ? { ...data.user, status:data.user.isActive?'Active':'Inactive' } : null }
export async function getActivity(limit=12) { if (useMock) return mock.getActivity(limit); return unwrap(await admin(`/activity-logs${qs({pageSize:limit})}`)) }
export async function getAdminDashboard() { if (useMock) return mock.getAdminDashboard(); return admin('/dashboard-stats',{auth:true}) }
export async function getAdminMatchEvents(id) { if (useMock) return (await mock.getMatch(id))?.events || []; return unwrap(await admin(`/matches/${id}/events`)) }
const routes={competitions:'/competitions',seasons:'/seasons',stadiums:'/stadiums',teams:'/teams',players:'/players',matches:'/matches',fixtures:'/matches',news:'/news',users:'/users'}
export async function adminList(collection) {
  if (useMock) return mock.adminList(collection)
  const items = unwrap(await admin(routes[collection]+qs({pageSize:100})))
  if (collection === 'matches' || collection === 'fixtures') return items.map(matchShape)
  if (collection === 'users') return items.map(userShape)
  return items
}
export async function adminCreateItem(collection,payload,actor) { if(useMock)return mock.adminCreateItem(collection,payload,actor); return admin(routes[collection],{method:'POST',body:collection==='users'?userPayload(payload):collection==='teams'?teamPayload(payload):(collection==='fixtures'||collection==='matches')?matchPayload(payload):payload}) }
export async function adminUpdateItem(collection,id,payload,actor) {
  if(useMock)return mock.adminUpdateItem(collection,id,payload,actor)
  if (collection === 'users') {
    const { password, ...fields } = payload
    if (password) await admin(`/users/${id}/reset-password`, { method: 'POST', body: { newPassword: password } })
    return admin(`/users/${id}`, { method: 'PUT', body: userPayload(fields) })
  }
  if (collection === 'matches' || collection === 'fixtures') {
    const current = await getMatch(id)
    return admin(`${routes[collection]}/${id}`,{method:'PUT',body:{...matchPayload(payload),version:current.version}})
  }
  return admin(`${routes[collection]}/${id}`,{method:'PUT',body:collection==='teams'?teamPayload(payload):payload})
}
export async function adminDeleteItem(collection,id,actor) { if(useMock)return mock.adminDeleteItem(collection,id,actor); const body=collection==='matches'||collection==='fixtures'?{version:(await getMatch(id)).version}:undefined; return admin(`${routes[collection]}/${id}`,{method:'DELETE',body}) }
export async function adminUpdateLiveMatch(matchId,updates,actor) { if(useMock)return mock.adminUpdateLiveMatch(matchId,updates,actor); const current=await getMatch(matchId); const version=updates.version ?? current.version; const action=updates.status==='HT'?'halftime':updates.status==='FT'?'fulltime':updates.status==='LIVE'?'minute':'minute'; return admin(`/matches/${matchId}/live/${action}`,{method:'POST',body:{version,minute:updates.minute}}) }
export async function adminAddMatchEvent(matchId,event,actor) {
  if(useMock)return mock.adminAddMatchEvent(matchId,event,actor)
  const m=await getMatch(matchId)
  const squad = await getPlayers({ teamId: event.teamId, pageSize: 100 })
  const byName = (name) => squad.find((player) => player.name?.trim().toLowerCase() === name?.trim().toLowerCase())?.id || null
  return admin(`/matches/${matchId}/events`,{method:'POST',body:{...event,version:m.version,type:event.type?.toLowerCase(),teamId:event.teamId||event.team?.id,playerId:event.playerId || byName(event.playerName),relatedPlayerId:event.relatedPlayerId || byName(event.assistName),note:event.note ?? event.detail ?? null,x:event.x == null || event.x === '' ? undefined : Number(event.x),y:event.y == null || event.y === '' ? undefined : Number(event.y)}})
}
export async function adminDeleteMatchEvent(matchId,eventId,actor) { if(useMock)return mock.adminDeleteMatchEvent(matchId,eventId,actor); const m=await getMatch(matchId); return admin(`/matches/${matchId}/events/${eventId}`,{method:'DELETE',body:{version:m.version}}) }
export async function adminResetDemoData(actor) { if(useMock)return mock.adminResetDemoData(actor); throw new ApiError('Demo reset is available only in mock mode', 400) }
