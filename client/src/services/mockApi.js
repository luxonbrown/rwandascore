/**
 * API facade
 * ===========
 * Every page/component imports from this file. The implementation below is a
 * localStorage-backed mock so the front-end is fully usable with no backend.
 *
 * REPLACE ME: swap the bodies of these functions for `fetch()` calls (or point
 * them at a REST/GraphQL/WebSocket service). Keep the exported names and shapes
 * and the UI will not need to change.
 *
 * The mock deliberately does not enforce authorization (it runs in the
 * browser). Admin routes are protected in the UI; a real backend must enforce
 * role checks server-side as well.
 */
import { loadDb, mutateDb, resetDb, makeId } from './mockBackend'

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const LIVE_STATUSES = ['LIVE', 'HT']

const ACTIVITY_IP = '197.243.14.87'
const DEFAULT_NEWS_IMAGE =
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=60'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function wait(min = 120, max = 280) {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function dayKeyOf(value) {
  const d = value instanceof Date ? value : new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayKey() {
  return dayKeyOf(new Date())
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function uniqueSlug(db, base, excludeId = null) {
  let slug = slugify(base) || makeId('slug')
  let suffix = 2
  while (db.news.some((article) => article.slug === slug && article.id !== excludeId)) {
    slug = `${slugify(base)}-${suffix}`
    suffix += 1
  }
  return slug
}

function uniqueTeamId(db, base) {
  let id = slugify(base) || makeId('team')
  let suffix = 2
  while (db.teams.some((team) => team.id === id)) {
    id = `${slugify(base)}-${suffix}`
    suffix += 1
  }
  return id
}

function uniqueCompetitionId(db, base) {
  let id = slugify(base) || makeId('competition')
  let suffix = 2
  while (db.competitions.some((comp) => comp.id === id)) {
    id = `${slugify(base)}-${suffix}`
    suffix += 1
  }
  return id
}

function sanitizeUser(user) {
  if (!user) return null
  const safe = { ...user }
  delete safe.password
  return safe
}

function competitionOf(db, id) {
  return db.competitions.find((competition) => competition.id === id) || null
}

function teamOf(db, id) {
  return db.teams.find((team) => team.id === id) || null
}

function decorateMatch(db, match) {
  if (!match) return null
  return {
    ...match,
    events: [...(match.events || [])].sort((a, b) => a.minute - b.minute),
    stats: match.stats || null,
    photos: match.photos || [],
    highlights: match.highlights || [],
    homeTeam: teamOf(db, match.homeTeamId),
    awayTeam: teamOf(db, match.awayTeamId),
    competition: competitionOf(db, match.competitionId),
  }
}

function allMatches(db) {
  return db.matches.map((match) => decorateMatch(db, match))
}

function sortByDate(a, b) {
  return new Date(a.date) - new Date(b.date)
}

function filterMatches(db, filters = {}) {
  let matches = allMatches(db)

  if (filters.competitionId) {
    matches = matches.filter((match) => match.competitionId === filters.competitionId)
  }
  if (filters.teamId) {
    matches = matches.filter(
      (match) => match.homeTeamId === filters.teamId || match.awayTeamId === filters.teamId,
    )
  }
  if (filters.date) {
    matches = matches.filter((match) => dayKeyOf(match.date) === filters.date)
  }
  if (filters.from) {
    const from = new Date(filters.from)
    matches = matches.filter((match) => new Date(match.date) >= from)
  }
  if (filters.to) {
    const to = new Date(filters.to)
    matches = matches.filter((match) => new Date(match.date) <= to)
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    matches = matches.filter((match) => statuses.includes(match.status))
  }
  if (filters.round) {
    matches = matches.filter((match) => match.round === filters.round)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    matches = matches.filter((match) => {
      const haystack = [
        match.homeTeam?.name,
        match.awayTeam?.name,
        match.venue,
        match.competition?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }

  matches.sort(sortByDate)
  if (filters.order === 'desc') matches.reverse()
  if (filters.limit) matches = matches.slice(0, filters.limit)
  return matches
}

function computeStandings(db) {
  const table = db.standings.map((row) => {
    const team = teamOf(db, row.teamId)
    const points = row.won * 3 + row.drawn
    const gd = row.gf - row.ga
    return { ...row, team, points, gd }
  })

  const rowsByTeam = new Map(table.map((row) => [row.teamId, row]))
  for (const match of db.matches.filter((item) => ['LIVE', 'HT'].includes(item.status)
    && competitionOf(db, item.competitionId)?.type === 'league')) {
    const home = rowsByTeam.get(match.homeTeamId)
    const away = rowsByTeam.get(match.awayTeamId)
    if (!home || !away) continue
    const result = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw'
    home.played += 1
    away.played += 1
    home.gf += match.homeScore
    home.ga += match.awayScore
    away.gf += match.awayScore
    away.ga += match.homeScore
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga
    home.isLive = true
    away.isLive = true
    if (result === 'home') {
      home.won += 1
      away.lost += 1
      home.points += 3
      home.form = [...(home.form || []), 'W'].slice(-5)
      away.form = [...(away.form || []), 'L'].slice(-5)
    } else if (result === 'away') {
      away.won += 1
      home.lost += 1
      away.points += 3
      home.form = [...(home.form || []), 'L'].slice(-5)
      away.form = [...(away.form || []), 'W'].slice(-5)
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += 1
      away.points += 1
      home.form = [...(home.form || []), 'D'].slice(-5)
      away.form = [...(away.form || []), 'D'].slice(-5)
    }
  }

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return (a.team?.name || '').localeCompare(b.team?.name || '')
  })

  return table.map((row, index) => {
    const position = index + 1
    let zone = null
    if (position <= 2) zone = 'caf-champions-league'
    else if (position === 3) zone = 'caf-confederation-cup'
    else if (position >= 15) zone = 'relegation'
    return { ...row, position, zone }
  })
}

function adjustMockStandings(db, match, direction) {
  if (competitionOf(db, match.competitionId)?.type !== 'league') return
  const home = db.standings.find((row) => row.teamId === match.homeTeamId)
  const away = db.standings.find((row) => row.teamId === match.awayTeamId)
  if (!home || !away) return

  const homeResult = match.homeScore > match.awayScore ? 'W' : match.homeScore < match.awayScore ? 'L' : 'D'
  const awayResult = homeResult === 'W' ? 'L' : homeResult === 'L' ? 'W' : 'D'
  for (const [row, scored, conceded, result] of [
    [home, match.homeScore, match.awayScore, homeResult],
    [away, match.awayScore, match.homeScore, awayResult],
  ]) {
    row.played = Math.max(0, (row.played || 0) + direction)
    row.gf = Math.max(0, (row.gf || 0) + scored * direction)
    row.ga = Math.max(0, (row.ga || 0) + conceded * direction)
    const resultKey = { W: 'won', D: 'drawn', L: 'lost' }[result]
    row[resultKey] = Math.max(0, (row[resultKey] || 0) + direction)
    const form = Array.isArray(row.form) ? row.form : []
    row.form = direction > 0 ? [...form, result].slice(-5) : form.slice(0, -1)
  }
}

function adjustPlayerGoal(db, event, direction) {
  if (!['goal', 'penalty'].includes(event.type)) return
  const name = event.playerName?.trim().toLocaleLowerCase()
  const player = db.players.find((item) => item.id === event.playerId)
    || db.players.find((item) => item.teamId === event.teamId && item.name?.trim().toLocaleLowerCase() === name)
  if (!player) return
  player.stats ||= {}
  player.stats.goals = Math.max(0, (player.stats.goals || 0) + direction)
  player.goals = player.stats.goals
}

function adjustPlayerCard(db, event, direction) {
  if (!['yellow', 'red'].includes(event.type)) return
  const player = db.players.find((item) => item.id === event.playerId)
  if (!player) return
  player.stats ||= {}
  const key = event.type === 'yellow' ? 'yellowCards' : 'redCards'
  player.stats[key] = Math.max(0, (player.stats[key] ?? player[key] ?? 0) + direction)
  player[key] = player.stats[key]
}

function adjustPlayerAssists(db, event, direction) {
  if (event.type !== 'goal' || !event.relatedPlayerId) return
  const player = db.players.find((item) => item.id === event.relatedPlayerId)
  if (!player) return
  player.stats ||= {}
  player.stats.assists = Math.max(0, (player.stats.assists ?? player.assists ?? 0) + direction)
  player.assists = player.stats.assists
}

function adjustPlayerAppearances(db, playerId, direction) {
  const player = db.players.find((item) => item.id === playerId)
  if (!player) return
  player.stats ||= {}
  player.stats.appearances = Math.max(0, (player.stats.appearances ?? player.appearances ?? 0) + direction)
  player.appearances = player.stats.appearances
}

function topScorersFor(db, competitionId = 'rwanda-premier-league', limit = 10) {
  const leagueTeamIds = new Set(db.standings.map((row) => row.teamId))
  let players = db.players
  if (competitionId === 'amavubi') {
    players = players.filter((player) => player.nationalTeam)
  } else {
    players = players.filter((player) => player.teamId && leagueTeamIds.has(player.teamId))
  }

  const scorers = players
    .filter((player) => (player.stats?.goals || 0) > 0)
    .sort((a, b) => {
      if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals
      if ((b.stats.assists || 0) !== (a.stats.assists || 0)) {
        return (b.stats.assists || 0) - (a.stats.assists || 0)
      }
      return (a.name || '').localeCompare(b.name || '')
    })
    .map((player, index) => ({
      rank: index + 1,
      player,
      team: teamOf(db, player.teamId),
      goals: player.stats.goals,
      assists: player.stats.assists || 0,
      appearances: player.stats.appearances || 0,
    }))

  let rank = 0
  let previousGoals = null
  return scorers.slice(0, limit).map((scorer, index) => {
    if (scorer.goals !== previousGoals) rank = index + 1
    previousGoals = scorer.goals
    return { ...scorer, rank }
  })
}

function squadsForTeam(db, teamId) {
  if (teamId === 'rwanda') {
    return db.players.filter((player) => player.nationalTeam)
  }
  return db.players.filter((player) => player.teamId === teamId)
}

function playerWithTeam(db, player) {
  return { ...player, team: teamOf(db, player.teamId) }
}

function teamForm(db, teamId, limit = 5) {
  return filterMatches(db, { teamId, status: 'FT', order: 'desc', limit })
    .map((match) => {
      const isHome = match.homeTeamId === teamId
      const scored = isHome ? match.homeScore : match.awayScore
      const conceded = isHome ? match.awayScore : match.homeScore
      if (scored > conceded) return 'W'
      if (scored < conceded) return 'L'
      return 'D'
    })
    .reverse()
}

function pushActivity(db, actor, { action, module, record, description }) {
  const user = actor?.id ? db.users.find((u) => u.id === actor.id) : null
  const theActor = user || actor || { name: 'System', role: 'ADMIN' }
  if (user) user.lastActive = new Date().toISOString()

  db.activity.unshift({
    id: makeId('a'),
    user: theActor.name || 'System',
    role: theActor.role || 'ADMIN',
    action,
    module: module || 'General',
    record: record || '—',
    description: description || '',
    ip: theActor.ip || ACTIVITY_IP,
    createdAt: new Date().toISOString(),
    minutesAgo: 0,
  })
  db.activity = db.activity.slice(0, 120)
}

function requireCollection(collection) {
  const allowed = ['competitions', 'teams', 'players', 'fixtures', 'news', 'users']
  if (!allowed.includes(collection)) throw new ApiError(`Unknown collection: ${collection}`, 404)
}

function collectionLabel(collection) {
  return (
    {
      competitions: 'Competition',
      teams: 'Team',
      players: 'Player',
      fixtures: 'Fixture',
      news: 'Article',
      users: 'User',
    }[collection] || 'Record'
  )
}

function findItem(db, collection, id) {
  const list =
    collection === 'fixtures'
      ? db.matches
      : collection === 'news'
        ? db.news
        : db[collection]
  return list.find((item) => item.id === id)
}

function normalizeFixture(db, input, existing = {}) {
  const data = { ...existing, ...input }
  const homeTeamId = data.homeTeamId
  const awayTeamId = data.awayTeamId

  if (!homeTeamId || !awayTeamId) throw new ApiError('Both teams are required')
  if (homeTeamId === awayTeamId) throw new ApiError('A team cannot play itself')
  if (!teamOf(db, homeTeamId) || !teamOf(db, awayTeamId)) {
    throw new ApiError('Home or away team does not exist')
  }
  if (!competitionOf(db, data.competitionId)) throw new ApiError('Competition does not exist')

  const date = data.date ? new Date(data.date) : new Date()
  if (Number.isNaN(date.getTime())) throw new ApiError('Invalid kick-off date')

  const homeScore = Number(data.homeScore || 0)
  const awayScore = Number(data.awayScore || 0)
  if (homeScore < 0 || awayScore < 0) throw new ApiError('Scores cannot be negative')

  const status = data.status || 'UPCOMING'
  const validStatuses = ['UPCOMING', 'LIVE', 'HT', 'FT', 'POSTPONED']
  if (!validStatuses.includes(status)) throw new ApiError('Invalid match status')

  return {
    ...data,
    competitionId: data.competitionId,
    round: data.round || 'Matchday',
    date: date.toISOString(),
    status,
    minute: status === 'FT' ? 90 : Number(data.minute || 0),
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    venue: data.venue || teamOf(db, homeTeamId)?.stadium || '',
    city: data.city || teamOf(db, homeTeamId)?.city || '',
    referee: data.referee || '',
    attendance: data.attendance === '' || data.attendance == null ? null : Number(data.attendance),
    events: data.events || [],
    stats: data.stats || null,
    lineups: data.lineups || null,
    photos: data.photos || [],
    highlights: data.highlights || [],
    updatedAt: new Date().toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export async function getMatches(filters = {}) {
  await wait()
  return filterMatches(loadDb(), filters)
}

export async function getLiveMatches() {
  await wait(90, 180)
  return filterMatches(loadDb(), { status: LIVE_STATUSES }).sort((a, b) => {
    const aComp = a.competitionId === 'rwanda-premier-league' ? 0 : 1
    const bComp = b.competitionId === 'rwanda-premier-league' ? 0 : 1
    return aComp - bComp || sortByDate(a, b)
  })
}

export async function getMatch(id) {
  await wait()
  const db = loadDb()
  const match = db.matches.find((item) => item.id === id)
  if (!match) throw new ApiError('Match not found', 404)
  return decorateMatch(db, match)
}

export async function getHeadToHead(teamAId, teamBId, limit = 5) {
  await wait(100, 220)
  const db = loadDb()
  return allMatches(db)
    .filter((match) => {
      const pair = [match.homeTeamId, match.awayTeamId]
      return pair.includes(teamAId) && pair.includes(teamBId) && match.status === 'FT'
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

export async function getCompetitions() {
  await wait(80, 180)
  return loadDb().competitions
}

export async function getCompetition(id) {
  await wait(80, 180)
  const db = loadDb()
  const competition = competitionOf(db, id)
  if (!competition) throw new ApiError('Competition not found', 404)
  return competition
}

export async function getCompetitionData(id) {
  await wait()
  const db = loadDb()
  const competition = competitionOf(db, id)
  if (!competition) throw new ApiError('Competition not found', 404)

  const matches = filterMatches(db, { competitionId: id })
  const standings = id === 'rwanda-premier-league' ? computeStandings(db) : []
  const topScorers = topScorersFor(db, id, 10)

  let bracket = null
  if (competition.type === 'cup') {
    const roundOrder = ['Quarter-final', 'Semi-final', 'Final']
    bracket = roundOrder
      .map((round) => ({
        round,
        matches: matches.filter((match) => match.round === round),
      }))
      .filter((round) => round.matches.length)
  }

  return {
    competition,
    matches,
    standings,
    topScorers,
    bracket,
    nationalSquad: id === 'amavubi' ? db.players.filter((player) => player.nationalTeam) : [],
  }
}

export async function getStandings(competitionId = 'rwanda-premier-league') {
  await wait(90, 200)
  if (competitionId !== 'rwanda-premier-league') return []
  return computeStandings(loadDb())
}

export async function getTopScorers(competitionId = 'rwanda-premier-league', limit = 10) {
  await wait(90, 200)
  return topScorersFor(loadDb(), competitionId, limit)
}

export async function getTeams({ competitionId = 'rwanda-premier-league' } = {}) {
  await wait()
  const db = loadDb()
  const standings = competitionId === 'rwanda-premier-league' ? computeStandings(db) : []
  const byTeam = new Map(standings.map((row) => [row.teamId, row]))

  let teams = db.teams
  if (competitionId === 'amavubi') {
    teams = teams.filter((team) => team.national)
  } else {
    teams = teams.filter((team) => team.competitionIds.includes(competitionId))
  }

  return teams
    .map((team) => {
      const standing = byTeam.get(team.id) || null
      return {
        ...team,
        standing,
        position: standing?.position || null,
        points: standing?.points || null,
        form: standing?.form || teamForm(db, team.id, 5),
      }
    })
    .sort((a, b) => {
      if (a.position && b.position) return a.position - b.position
      return a.name.localeCompare(b.name)
    })
}

export async function getTeamDetail(id) {
  await wait()
  const db = loadDb()
  const team = teamOf(db, id)
  if (!team) throw new ApiError('Team not found', 404)

  const squad = squadsForTeam(db, id)
    .map((player) => playerWithTeam(db, player))
    .sort((a, b) => {
      const order = { GK: 0, DF: 1, MF: 2, FW: 3 }
      return order[a.position] - order[b.position] || a.number - b.number
    })

  const matches = filterMatches(db, { teamId: id })
  const upcoming = matches
    .filter((match) => match.status === 'UPCOMING')
    .sort(sortByDate)
  const results = matches
    .filter((match) => match.status === 'FT')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const standing =
    id === 'rwanda'
      ? null
      : computeStandings(db).find((row) => row.teamId === id) || null
  const topScorer = [...squad]
    .filter((player) => (player.stats?.goals || 0) > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals)[0] || null

  return {
    team,
    squad,
    matches,
    upcoming,
    results,
    standing,
    form: teamForm(db, id, 5),
    nextMatch: upcoming[0] || null,
    lastMatch: results[0] || null,
    topScorer,
  }
}

export async function getPlayers({
  teamId,
  nationalTeam,
  search = '',
  position = 'ALL',
  sort = 'goals',
  page = 1,
  pageSize = 12,
} = {}) {
  await wait(100, 240)
  const db = loadDb()
  let players = db.players

  if (teamId) {
    players = teamId === 'rwanda'
      ? players.filter((player) => player.nationalTeam)
      : players.filter((player) => player.teamId === teamId)
  }
  if (typeof nationalTeam === 'boolean') {
    players = players.filter((player) => Boolean(player.nationalTeam) === nationalTeam)
  }
  if (position && position !== 'ALL') {
    players = players.filter((player) => player.position === position)
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    players = players.filter((player) => player.name.toLowerCase().includes(q))
  }

  const sorters = {
    goals: (a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0),
    assists: (a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0),
    appearances: (a, b) => (b.stats?.appearances || 0) - (a.stats?.appearances || 0),
    age: (a, b) => a.age - b.age,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  players = [...players].sort(sorters[sort] || sorters.goals)

  const total = players.length
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  const items = players
    .slice(start, start + pageSize)
    .map((player) => playerWithTeam(db, player))

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getPlayer(id) {
  await wait(100, 220)
  const db = loadDb()
  const player = db.players.find((item) => item.id === id)
  if (!player) throw new ApiError('Player not found', 404)

  const teammates = db.players
    .filter(
      (item) =>
        item.id !== player.id &&
        (player.teamId ? item.teamId === player.teamId : item.nationalTeam && player.nationalTeam),
    )
    .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
    .slice(0, 4)
    .map((item) => playerWithTeam(db, item))

  const scorers = topScorersFor(
    db,
    player.nationalTeam ? 'amavubi' : 'rwanda-premier-league',
    Math.max(db.players.length, 1),
  )
  const rankEntry = scorers.find((entry) => entry.player.id === player.id)
  const recentEvents = db.matches.flatMap((match) => (match.events || [])
    .filter((event) => event.playerId === player.id || event.relatedPlayerId === player.id)
    .map((event) => ({
      ...event,
      matchId: match.id,
      match: `${teamOf(db, match.homeTeamId)?.name || 'Home'} ${match.homeScore}-${match.awayScore} ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      related: event.relatedPlayerId === player.id,
    })))
    .sort((a, b) => Number(b.minute || 0) - Number(a.minute || 0))
    .slice(0, 10)

  return {
    player: playerWithTeam(db, player),
    team: teamOf(db, player.teamId),
    teammates,
    scorerRank: rankEntry?.rank || null,
    recentEvents,
  }
}

export async function getNews({
  category,
  featured,
  search = '',
  excludeSlug,
  limit,
} = {}) {
  await wait(100, 220)
  let articles = loadDb().news.filter((article) => article.status !== 'draft').sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  )

  if (category && category !== 'All') {
    articles = articles.filter(
      (article) => article.category.toLowerCase() === category.toLowerCase(),
    )
  }
  if (typeof featured === 'boolean') {
    articles = articles.filter((article) => Boolean(article.featured) === featured)
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    articles = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q),
    )
  }
  if (excludeSlug) articles = articles.filter((article) => article.slug !== excludeSlug)
  if (limit) articles = articles.slice(0, limit)
  return articles
}

export async function getArticle(slug) {
  await wait(100, 200)
  const db = loadDb()
  const article = db.news.find((item) => (item.slug === slug || item.id === slug) && item.status !== 'draft')
  if (!article) throw new ApiError('Article not found', 404)
  const related = db.news
    .filter((item) => item.id !== article.id && item.category === article.category)
    .slice(0, 3)
  return { article, related }
}

export async function searchAll(query) {
  await wait(120, 260)
  const q = query.trim().toLowerCase()
  if (!q) return { teams: [], players: [], matches: [], news: [], competitions: [] }

  const db = loadDb()
  return {
    teams: db.teams
      .filter((team) =>
        [team.name, team.shortName, team.city, team.stadium].join(' ').toLowerCase().includes(q),
      )
      .slice(0, 6),
    players: db.players
      .filter((player) => player.name.toLowerCase().includes(q))
      .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
      .slice(0, 6)
      .map((player) => playerWithTeam(db, player)),
    matches: filterMatches(db, { search: q, limit: 6 }),
    competitions: db.competitions
      .filter((competition) =>
        [competition.name, competition.shortName, competition.description]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 4),
    news: [...db.news]
      .filter((article) =>
        [article.title, article.excerpt, article.category].join(' ').toLowerCase().includes(q),
      )
      .slice(0, 6),
  }
}

export async function getFavouritesData({ teamIds = [], playerIds = [] } = {}) {
  await wait(100, 240)
  const db = loadDb()
  const teams = teamIds.map((id) => teamOf(db, id)).filter(Boolean)
  const players = playerIds
    .map((id) => db.players.find((player) => player.id === id))
    .filter(Boolean)
    .map((player) => playerWithTeam(db, player))

  const playerTeamIds = players.map((player) => player.teamId).filter(Boolean)
  const relevantTeams = new Set([...teamIds, ...playerTeamIds])
  const matches = allMatches(db)
    .filter(
      (match) =>
        relevantTeams.has(match.homeTeamId) || relevantTeams.has(match.awayTeamId),
    )
    .sort((a, b) => {
      const aLive = LIVE_STATUSES.includes(a.status) ? 0 : 1
      const bLive = LIVE_STATUSES.includes(b.status) ? 0 : 1
      if (aLive !== bLive) return aLive - bLive
      return new Date(a.date) - new Date(b.date)
    })
    .slice(0, 10)

  return { teams, players, matches }
}

/* -------------------------------------------------------------------------- */
/* Mock auth                                                                  */
/* -------------------------------------------------------------------------- */

export async function login(email, password) {
  await wait(200, 420)
  const db = loadDb()
  const user = db.users.find(
    (candidate) => candidate.email.toLowerCase() === String(email).trim().toLowerCase(),
  )

  if (!user || user.password !== password) {
    throw new ApiError('Invalid email or password', 401)
  }
  if (user.status !== 'Active') {
    throw new ApiError('This account is disabled. Contact an administrator.', 403)
  }

  const actor = { id: user.id, name: user.name, role: user.role }
  mutateDb('auth', (current) => {
    pushActivity(current, actor, {
      action: 'Signed In',
      module: 'Admin',
      record: user.name,
      description: 'Authenticated to the admin dashboard',
    })
    const record = current.users.find((item) => item.id === user.id)
    if (record) record.lastActive = new Date().toISOString()
  })

  const fresh = loadDb().users.find((item) => item.id === user.id)
  return {
    token: `mock-token-${makeId(user.id)}`,
    user: sanitizeUser(fresh),
  }
}

export async function getUserById(id) {
  await wait(80, 160)
  const db = loadDb()
  return sanitizeUser(db.users.find((user) => user.id === id))
}

export async function getActivity(limit = 12) {
  await wait(100, 200)
  return loadDb().activity
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

/* -------------------------------------------------------------------------- */
/* Admin reads                                                                */
/* -------------------------------------------------------------------------- */

export async function getAdminDashboard() {
  await wait()
  const db = loadDb()
  const today = todayKey()
  const standings = computeStandings(db)

  return {
    counts: {
      teams: db.teams.filter((team) => !team.national).length,
      players: db.players.length,
      competitions: db.competitions.length,
      fixtures: db.matches.length,
      live: db.matches.filter((match) => LIVE_STATUSES.includes(match.status)).length,
      news: db.news.length,
      users: db.users.length,
      editorsOnline: db.presence.filter((person) => person.status === 'online').length,
    },
    liveMatches: filterMatches(db, { status: LIVE_STATUSES }),
    todayMatches: filterMatches(db, { date: today }),
    upcoming: filterMatches(db, { status: 'UPCOMING' }).slice(0, 5),
    activity: db.activity.slice(0, 8),
    presence: db.presence,
    topOfTable: standings.slice(0, 4),
    latestNews: [...db.news]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 4),
    dataUpdatedAt: db.updatedAt || db.createdAt,
  }
}

export async function adminList(collection) {
  await wait(90, 200)
  requireCollection(collection)
  const db = loadDb()

  if (collection === 'fixtures') {
    return filterMatches(db, { order: 'desc' })
  }
  if (collection === 'players') {
    return db.players
      .map((player) => playerWithTeam(db, player))
      .sort((a, b) => (a.team?.name || '').localeCompare(b.team?.name || '') || a.name.localeCompare(b.name))
  }
  if (collection === 'users') {
    return db.users.map(sanitizeUser)
  }
  if (collection === 'news') {
    return [...db.news].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  }
  if (collection === 'teams') {
    return [...db.teams].sort((a, b) => a.name.localeCompare(b.name))
  }
  return [...db[collection]]
}

/* -------------------------------------------------------------------------- */
/* Admin mutations                                                            */
/* -------------------------------------------------------------------------- */

export async function adminCreateItem(collection, payload, actor) {
  await wait()
  requireCollection(collection)

  return mutateDb(collection, (db) => {
    let created
    const label = collectionLabel(collection)

    if (collection === 'fixtures') {
      created = {
        id: makeId('m'),
        ...normalizeFixture(db, payload),
      }
      db.matches.push(created)
    } else if (collection === 'teams') {
      if (!payload.name?.trim()) throw new ApiError('Team name is required')
      const id = uniqueTeamId(db, payload.name)
      created = {
        id,
        name: payload.name.trim(),
        shortName: payload.shortName?.trim() || payload.name.trim(),
        initials:
          payload.initials?.trim().toUpperCase().slice(0, 3) ||
          payload.name
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 3),
        city: payload.city || '',
        stadium: payload.stadium || '',
        founded: Number(payload.founded) || null,
        nickname: payload.nickname || '',
        coach: payload.coach || { name: '', nationality: 'Rwanda' },
        colors: payload.colors || { primary: '#FF6B00', secondary: '#121212' },
        competitionIds: payload.competitionIds?.length
          ? payload.competitionIds
          : ['rwanda-premier-league'],
        national: Boolean(payload.national),
        description: payload.description || '',
        logo: payload.logo || null,
      }
      db.teams.push(created)
    } else if (collection === 'competitions') {
      if (!payload.name?.trim()) throw new ApiError('Competition name is required')
      const id = uniqueCompetitionId(db, payload.name)
      created = {
        id,
        slug: id,
        name: payload.name.trim(),
        shortName: payload.shortName?.trim() || payload.name.trim(),
        country: payload.country || 'Rwanda',
        type: payload.type || 'league',
        season: payload.season || '2025/26',
        logoText: payload.logoText || payload.name.slice(0, 3).toUpperCase(),
        color: payload.color || '#FF6B00',
        secondaryColor: payload.secondaryColor || '#121212',
        description: payload.description || '',
        teamCount: Number(payload.teamCount) || 0,
      }
      db.competitions.push(created)
    } else if (collection === 'players') {
      if (!payload.name?.trim()) throw new ApiError('Player name is required')
      created = {
        id: makeId('p'),
        name: payload.name.trim(),
        teamId: payload.teamId || null,
        position: payload.position || 'MF',
        number: Number(payload.number) || null,
        nationality: payload.nationality || 'Rwanda',
        age: Number(payload.age) || 22,
        height: Number(payload.height) || null,
        foot: payload.foot || 'Right',
        faceId: payload.faceId || payload.photoUrl || null,
        photoUrl: payload.faceId || payload.photoUrl || null,
        nationalTeam: Boolean(payload.nationalTeam),
        stats: {
          appearances: Number(payload.appearances) || 0,
          goals: Number(payload.goals) || 0,
          assists: Number(payload.assists) || 0,
          yellowCards: Number(payload.yellowCards) || 0,
          redCards: Number(payload.redCards) || 0,
          minutes: Number(payload.minutes) || 0,
          cleanSheets: Number(payload.cleanSheets) || 0,
        },
        bio: payload.bio || '',
      }
      db.players.push(created)
    } else if (collection === 'news') {
      if (!payload.title?.trim()) throw new ApiError('Title is required')
      const publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : new Date()
      created = {
        id: makeId('n'),
        slug: uniqueSlug(db, payload.slug || payload.title),
        title: payload.title.trim(),
        excerpt: payload.excerpt || '',
        category: payload.category || 'Rwanda Premier League',
        source: payload.source || 'RwandaScore Newsroom',
        author: payload.author || actor?.name || 'RwandaScore',
        publishedAt: publishedAt.toISOString(),
        status: payload.status || 'draft',
        featured: Boolean(payload.featured),
        image: payload.image || DEFAULT_NEWS_IMAGE,
        body: Array.isArray(payload.body)
          ? payload.body.filter(Boolean)
          : String(payload.body || '')
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean),
      }
      db.news.unshift(created)
    } else if (collection === 'users') {
      if (!payload.name?.trim()) throw new ApiError('Name is required')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) {
        throw new ApiError('A valid email is required')
      }
      if (db.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new ApiError('That email is already in use', 409)
      }
      created = {
        id: makeId('u'),
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password || 'editor123',
        role: payload.role === 'ADMIN' ? 'ADMIN' : 'EDITOR',
        status: payload.status || 'Active',
        phone: payload.phone || '',
        lastActive: new Date().toISOString(),
      }
      db.users.push(created)
      created = sanitizeUser(created)
    }

    pushActivity(db, actor, {
      action: `Created ${label}`,
      module:
        collection === 'fixtures'
          ? competitionOf(db, payload.competitionId)?.name
          : label,
      record: created.name || created.title || created.email || created.id,
      description: `Added a new ${label.toLowerCase()}`,
    })

    return collection === 'fixtures' ? decorateMatch(db, created) : created
  })
}

export async function adminUpdateItem(collection, id, payload, actor) {
  await wait()
  requireCollection(collection)

  return mutateDb(collection, (db) => {
    const item = findItem(db, collection, id)
    if (!item) throw new ApiError(`${collectionLabel(collection)} not found`, 404)

    const before = { ...item }
    const label = collectionLabel(collection)

    if (collection === 'fixtures') {
      const normalized = normalizeFixture(db, payload, item)
      Object.assign(item, normalized)
    } else if (collection === 'teams') {
      if (payload.name !== undefined) {
        if (!payload.name.trim()) throw new ApiError('Team name is required')
        item.name = payload.name.trim()
      }
      const allowed = [
        'shortName',
        'initials',
        'city',
        'stadium',
        'founded',
        'nickname',
        'coach',
        'colors',
        'competitionIds',
        'national',
        'description',
        'logo',
      ]
      allowed.forEach((key) => {
        if (payload[key] !== undefined) item[key] = payload[key]
      })
    } else if (collection === 'competitions') {
      const allowed = [
        'name',
        'shortName',
        'country',
        'type',
        'season',
        'logoText',
        'color',
        'secondaryColor',
        'description',
        'teamCount',
      ]
      if (payload.name !== undefined && !payload.name.trim()) {
        throw new ApiError('Competition name is required')
      }
      allowed.forEach((key) => {
        if (payload[key] !== undefined) item[key] = payload[key]
      })
    } else if (collection === 'players') {
      const allowed = ['name', 'teamId', 'position', 'number', 'nationality', 'age', 'height', 'foot', 'faceId', 'nationalTeam', 'bio']
      allowed.forEach((key) => {
        if (payload[key] !== undefined) item[key] = payload[key]
      })
      if (payload.name !== undefined && !payload.name.trim()) {
        throw new ApiError('Player name is required')
      }
      const statKeys = ['appearances', 'goals', 'assists', 'yellowCards', 'redCards', 'minutes', 'cleanSheets']
      if (statKeys.some((key) => payload[key] !== undefined)) {
        item.stats = { ...item.stats }
        statKeys.forEach((key) => {
          if (payload[key] !== undefined) item.stats[key] = Number(payload[key])
        })
      }
    } else if (collection === 'news') {
      const allowed = ['title', 'excerpt', 'category', 'source', 'author', 'featured', 'image']
      if (payload.title !== undefined) {
        if (!payload.title.trim()) throw new ApiError('Title is required')
        item.title = payload.title.trim()
      }
      allowed.forEach((key) => {
        if (key !== 'title' && payload[key] !== undefined) item[key] = payload[key]
      })
      if (payload.body !== undefined) {
        item.body = Array.isArray(payload.body)
          ? payload.body.filter(Boolean)
          : String(payload.body)
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
      }
      if (payload.status !== undefined) {
        item.status = payload.status
        if (payload.status === 'published' && !item.publishedAt) item.publishedAt = new Date().toISOString()
      }
      if (payload.publishedAt) {
        const publishedAt = new Date(payload.publishedAt)
        if (!Number.isNaN(publishedAt.getTime())) item.publishedAt = publishedAt.toISOString()
      }
      if (payload.slug) {
        item.slug = uniqueSlug(db, payload.slug, item.id)
      }
    } else if (collection === 'users') {
      if (payload.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
          throw new ApiError('A valid email is required')
        }
        if (
          db.users.some(
            (user) =>
              user.id !== id &&
              user.email.toLowerCase() === payload.email.toLowerCase(),
          )
        ) {
          throw new ApiError('That email is already in use', 409)
        }
        item.email = payload.email.trim().toLowerCase()
      }
      if (payload.name !== undefined) {
        if (!payload.name.trim()) throw new ApiError('Name is required')
        item.name = payload.name.trim()
      }
      if (payload.role) item.role = payload.role === 'ADMIN' ? 'ADMIN' : 'EDITOR'
      if (payload.status) item.status = payload.status
      if (payload.phone !== undefined) item.phone = payload.phone
      if (payload.password) item.password = payload.password

      if (item.role !== 'ADMIN' || item.status !== 'Active') {
        const activeAdmins = db.users.filter(
          (user) => user.role === 'ADMIN' && user.status === 'Active',
        )
        if (before.role === 'ADMIN' && activeAdmins.filter((user) => user.id !== id).length === 0) {
          throw new ApiError('At least one active admin account is required', 409)
        }
      }
      Object.assign(item, sanitizeUser(item))
    }

    pushActivity(db, actor, {
      action: `Updated ${label}`,
      module:
        collection === 'fixtures'
          ? competitionOf(db, item.competitionId)?.name
          : label,
      record: item.name || item.title || item.email || item.id,
      description: payload.description || `Edited ${label.toLowerCase()} details`,
    })

    return collection === 'fixtures'
      ? decorateMatch(db, item)
      : collection === 'users'
        ? sanitizeUser(item)
        : item
  })
}

export async function adminDeleteItem(collection, id, actor) {
  await wait()
  requireCollection(collection)

  return mutateDb(collection, (db) => {
    const label = collectionLabel(collection)
    const item = findItem(db, collection, id)
    if (!item) throw new ApiError(`${label} not found`, 404)

    if (collection === 'fixtures') {
      db.matches = db.matches.filter((match) => match.id !== id)
    } else if (collection === 'teams') {
      db.teams = db.teams.filter((team) => team.id !== id)
      db.players = db.players.filter((player) => player.teamId !== id)
      db.matches = db.matches.filter(
        (match) => match.homeTeamId !== id && match.awayTeamId !== id,
      )
      db.standings = db.standings.filter((row) => row.teamId !== id)
    } else if (collection === 'competitions') {
      db.competitions = db.competitions.filter((competition) => competition.id !== id)
      db.matches = db.matches.filter((match) => match.competitionId !== id)
    } else if (collection === 'players') {
      db.players = db.players.filter((player) => player.id !== id)
    } else if (collection === 'news') {
      db.news = db.news.filter((article) => article.id !== id)
    } else if (collection === 'users') {
      if (actor?.id === id) throw new ApiError('You cannot delete your own account', 409)
      const target = db.users.find((user) => user.id === id)
      const activeAdmins = db.users.filter(
        (user) => user.role === 'ADMIN' && user.status === 'Active',
      )
      if (target?.role === 'ADMIN' && activeAdmins.length <= 1) {
        throw new ApiError('At least one active admin account is required', 409)
      }
      db.users = db.users.filter((user) => user.id !== id)
    }

    pushActivity(db, actor, {
      action: `Deleted ${label}`,
      module: label,
      record: item.name || item.title || item.email || item.id,
      description: 'Removed the record from the project',
    })

    return { id }
  })
}

/* -------------------------------------------------------------------------- */
/* Live match control                                                         */
/* -------------------------------------------------------------------------- */

export async function adminUpdateLiveMatch(matchId, updates, actor) {
  await wait(100, 220)

  return mutateDb('live', (db) => {
    const match = db.matches.find((item) => item.id === matchId)
    if (!match) throw new ApiError('Match not found', 404)

    const priorStatus = match.status
    const hadStandingContribution = match.standingApplied === true
    if (hadStandingContribution) adjustMockStandings(db, match, -1)
    const previous = `${match.homeScore}-${match.awayScore}`
    if (updates.homeScore !== undefined) {
      const score = Number(updates.homeScore)
      if (score < 0) throw new ApiError('Score cannot be negative')
      match.homeScore = score
    }
    if (updates.awayScore !== undefined) {
      const score = Number(updates.awayScore)
      if (score < 0) throw new ApiError('Score cannot be negative')
      match.awayScore = score
    }
    if (updates.minute !== undefined) {
      const minute = Number(updates.minute)
      if (minute < 0 || minute > 120) throw new ApiError('Minute must be between 0 and 120')
      match.minute = minute
    }
    if (updates.stats) match.stats = { ...(match.stats || {}), ...updates.stats }
    if (updates.status !== undefined) {
      const validStatuses = ['UPCOMING', 'LIVE', 'HT', 'FT', 'POSTPONED']
      if (!validStatuses.includes(updates.status)) throw new ApiError('Invalid status')
      match.status = updates.status
      if (priorStatus === 'UPCOMING' && updates.status === 'LIVE') {
        const starters = ['home', 'away'].flatMap((side) => (match.lineups?.[side]?.rows || [])
          .flatMap((row) => (row.players || []).map((item) => item.playerId).filter(Boolean)))
        for (const playerId of new Set(starters)) adjustPlayerAppearances(db, playerId, 1)
      }
      if (updates.status === 'FT') match.minute = 90
    }
    if (match.status === 'FT' && (hadStandingContribution || priorStatus !== 'FT')) {
      adjustMockStandings(db, match, 1)
      match.standingApplied = true
    } else {
      match.standingApplied = false
    }
    match.updatedAt = new Date().toISOString()

    const updated = `${match.homeScore}-${match.awayScore}`
    pushActivity(db, actor, {
      action: 'Updated Live Match',
      module: competitionOf(db, match.competitionId)?.name || 'Match Centre',
      record: `${teamOf(db, match.homeTeamId)?.name || 'Home'} vs ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      description:
        previous !== updated
          ? `Changed score from ${previous} to ${updated}`
          : updates.status
            ? `Set match status to ${updates.status}`
            : `Updated match clock to ${match.minute}'`,
    })

    return decorateMatch(db, match)
  })
}

export async function adminUpdateMatchLiveBackground(matchId, imageUrl, actor) {
  await wait(100, 220)
  return mutateDb('live', (db) => {
    const match = db.matches.find((item) => item.id === matchId)
    if (!match) throw new ApiError('Match not found', 404)
    match.stats = { ...(match.stats || {}) }
    if (imageUrl?.trim()) match.stats.liveBackgroundImageUrl = imageUrl.trim()
    else delete match.stats.liveBackgroundImageUrl
    match.version = Number(match.version || 0) + 1
    match.updatedAt = new Date().toISOString()
    pushActivity(db, actor, {
      action: 'Updated Match Background',
      module: competitionOf(db, match.competitionId)?.name || 'Match Centre',
      record: `${teamOf(db, match.homeTeamId)?.name || 'Home'} vs ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      description: 'Updated live match background image',
    })
    return decorateMatch(db, match)
  })
}

export async function adminUpdateMatchLineups(matchId, lineups, actor) {
  await wait(100, 220)

  return mutateDb('fixtures', (db) => {
    const match = db.matches.find((item) => item.id === matchId)
    if (!match) throw new ApiError('Match not found', 404)
    if (match.status !== 'UPCOMING') throw new ApiError('Lineups can only be set for an upcoming match')

    const formatSide = (side, teamId) => {
      const ids = [...side.starters, ...side.bench]
      if (!side.starters.length || new Set(ids).size !== ids.length) {
        throw new ApiError('Choose unique starters and bench players for both teams')
      }
      const players = ids.map((id) => db.players.find((player) => player.id === id))
      if (players.some((player) => !player || player.teamId !== teamId)) {
        throw new ApiError('Every lineup player must belong to the selected team')
      }
      const byId = new Map(players.map((player) => [player.id, player]))
      let offset = 0
      const rowSizes = [1, ...side.formation.split('-').map(Number)]
      const rows = rowSizes.map((size, index) => {
        const playerIds = side.starters.slice(offset, offset + size)
        offset += size
        return {
          label: index === 0 ? 'GK' : `line-${index}`,
          players: playerIds.map((id) => ({
            playerId: id,
            name: byId.get(id).name,
            number: byId.get(id).number ?? '',
            position: byId.get(id).position,
            photoUrl: byId.get(id).photoUrl || byId.get(id).faceId || null,
            rating: null,
          })),
        }
      }).filter((row) => row.players.length)
      return {
        formation: side.formation,
        rows,
        bench: side.bench.map((id) => ({
          playerId: id,
          name: byId.get(id).name,
          number: byId.get(id).number ?? '',
          position: byId.get(id).position,
          photoUrl: byId.get(id).photoUrl || byId.get(id).faceId || null,
          rating: null,
        })),
      }
    }

    match.lineups = {
      home: formatSide(lineups.home, match.homeTeamId),
      away: formatSide(lineups.away, match.awayTeamId),
    }
    match.version = Number(match.version || 0) + 1
    match.updatedAt = new Date().toISOString()
    pushActivity(db, actor, {
      action: 'Updated Match Lineups',
      module: competitionOf(db, match.competitionId)?.name || 'Match Centre',
      record: `${teamOf(db, match.homeTeamId)?.name || 'Home'} vs ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      description: 'Set starting players and bench for an upcoming fixture',
    })
    return decorateMatch(db, match)
  })
}

export async function adminAddMatchEvent(matchId, event, actor) {
  await wait(100, 220)

  return mutateDb('live', (db) => {
    const match = db.matches.find((item) => item.id === matchId)
    if (!match) throw new ApiError('Match not found', 404)
    if (!event.playerName?.trim()) throw new ApiError('Player name is required')
    if (event.minute == null || Number(event.minute) < 0 || Number(event.minute) > 120) {
      throw new ApiError('A valid minute is required')
    }

    const registeredPlayer = db.players.find((item) => item.id === event.playerId)
      || db.players.find((item) => item.teamId === event.teamId
        && item.name?.trim().toLocaleLowerCase() === event.playerName.trim().toLocaleLowerCase())
    if (['goal', 'penalty'].includes(event.type || 'goal') && !registeredPlayer) {
      throw new ApiError('Select a registered player so the goal can be added to the scorer table')
    }

    const created = {
      id: makeId('ev'),
      minute: Number(event.minute),
      type: event.type || 'goal',
      teamId: event.teamId,
      playerId: registeredPlayer?.id || null,
      relatedPlayerId: event.relatedPlayerId || db.players.find((item) => item.teamId === event.teamId && item.name?.trim().toLocaleLowerCase() === (event.assistName || '').trim().toLocaleLowerCase())?.id || null,
      playerName: event.playerName.trim(),
      assistName: event.assistName || '',
      playerOut: event.playerOut || '',
      detail: event.detail || '',
    }
    if (![match.homeTeamId, match.awayTeamId].includes(created.teamId)) {
      throw new ApiError('Event team must be one of the two teams')
    }

    if (match.standingApplied) adjustMockStandings(db, match, -1)
    match.events = [...(match.events || []), created].sort((a, b) => a.minute - b.minute)
    adjustPlayerGoal(db, created, 1)
    adjustPlayerCard(db, created, 1)
    adjustPlayerAssists(db, created, 1)
    if (created.type === 'substitution' && created.playerId) adjustPlayerAppearances(db, created.playerId, 1)

    if (['goal', 'penalty'].includes(created.type)) {
      if (created.teamId === match.homeTeamId) match.homeScore += 1
      else match.awayScore += 1
    } else if (created.type === 'own_goal') {
      if (created.teamId === match.homeTeamId) match.awayScore += 1
      else match.homeScore += 1
    }
    if (match.standingApplied) adjustMockStandings(db, match, 1)

    match.updatedAt = new Date().toISOString()

    pushActivity(db, actor, {
      action: 'Added Match Event',
      module: competitionOf(db, match.competitionId)?.name || 'Match Centre',
      record: `${teamOf(db, match.homeTeamId)?.name || 'Home'} vs ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      description:
        created.type === 'goal' || created.type === 'penalty'
          ? `${created.minute}' Goal — ${created.playerName}`
          : `${created.minute}' ${created.type.replace('_', ' ')} — ${created.playerName}`,
    })

    return decorateMatch(db, match)
  })
}

export async function adminDeleteMatchEvent(matchId, eventIndex, actor) {
  await wait(100, 200)

  return mutateDb('live', (db) => {
    const match = db.matches.find((item) => item.id === matchId)
    if (!match) throw new ApiError('Match not found', 404)
    const index = Number(eventIndex)
    if (!Number.isInteger(index) || index < 0 || index >= (match.events || []).length) {
      throw new ApiError('Event not found', 404)
    }

    if (match.standingApplied) adjustMockStandings(db, match, -1)
    const [removed] = match.events.splice(index, 1)
    adjustPlayerGoal(db, removed, -1)
    adjustPlayerCard(db, removed, -1)
    adjustPlayerAssists(db, removed, -1)
    if (removed.type === 'substitution' && removed.playerId) adjustPlayerAppearances(db, removed.playerId, -1)
    if (['goal', 'penalty'].includes(removed.type)) {
      if (removed.teamId === match.homeTeamId) match.homeScore = Math.max(0, match.homeScore - 1)
      else match.awayScore = Math.max(0, match.awayScore - 1)
    } else if (removed.type === 'own_goal') {
      if (removed.teamId === match.homeTeamId) match.awayScore = Math.max(0, match.awayScore - 1)
      else match.homeScore = Math.max(0, match.homeScore - 1)
    }
    if (match.standingApplied) adjustMockStandings(db, match, 1)

    pushActivity(db, actor, {
      action: 'Deleted Match Event',
      module: competitionOf(db, match.competitionId)?.name || 'Match Centre',
      record: `${teamOf(db, match.homeTeamId)?.name || 'Home'} vs ${teamOf(db, match.awayTeamId)?.name || 'Away'}`,
      description: `Removed ${removed.minute}' ${removed.type} — ${removed.playerName}`,
    })

    return decorateMatch(db, match)
  })
}

export async function adminResetDemoData(actor) {
  await wait(200, 350)
  resetDb()
  mutateDb('reset', (db) => {
    pushActivity(db, actor, {
      action: 'Reset Demo Data',
      module: 'System',
      record: 'Demo database',
      description: 'Re-seeded all demo records',
    })
  })
  return { ok: true }
}
