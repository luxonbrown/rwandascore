/**
 * Mock database builder.
 *
 * Fixtures are seeded relative to "today" so the demo always has live matches,
 * results and upcoming games. Everything is deterministic apart from the date.
 *
 * REPLACE ME: when the real backend exists this file and `mockBackend.js` can be
 * deleted. Components only talk to `src/services/api.js`.
 */
import teamsData from './teams.json'
import competitionsData from './competitions.json'
import curatedPlayers from './players.json'
import newsData from './news.json'
import standingsData from './standings.json'
import usersData from './users.json'
import activityData from './activity.json'
import presenceData from './presence.json'

const PHOTO_ACTION =
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=60'
const PHOTO_CROWD =
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1000&q=60'
const PHOTO_STADIUM =
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=60'

const FIRST_NAMES = [
  'Eric', 'Jean-Paul', 'Emmanuel', 'Patrick', 'Kevin', 'Thierry', 'Olivier', 'Blaise',
  'Fiston', 'Innocent', 'Gilbert', 'Didier', 'Claude', 'Anicet', 'Yves', 'Cedric',
  'Ramadhan', 'Christian', 'Fabrice', 'Pascal', 'Moise', 'Samuel', 'Alexis', 'Bosco',
  'Elie', 'Herve', 'Landry', 'Arnaud', 'Bonheur', 'Prince', 'Evode', 'Shalom',
  'Gad', 'Sadiki', 'Salim', 'Alain', 'Denis', 'Emery', 'Franck', 'Aimable',
]

const LAST_NAMES = [
  'Niyonzima', 'Habimana', 'Nshimiyimana', 'Uwimana', 'Hakizimana', 'Mugisha',
  'Ndayisenga', 'Iradukunda', 'Bizimana', 'Munyaneza', 'Nsengimana', 'Nkurunziza',
  'Ndayishimiye', 'Nsabimana', 'Mugabo', 'Byiringiro', 'Kwizera', 'Ntaganda',
  'Uwase', 'Mukamana', 'Ingabire', 'Mutesi', 'Gasana', 'Rukundo', 'Twagirayezu',
  'Habyarimana', 'Ntirenganya', 'Rugamba', 'Igiraneza', 'Muhire', 'Shyaka', 'Nkusi',
  'Kamanzi', 'Gahamanyi', 'Nzeyimana', 'Umutoni', 'Yandagiye', 'Tuyishime',
  'Rurangirwa', 'Ndagijimana',
]

const FORMATIONS = {
  apr: '4-3-3',
  rayon: '4-2-3-1',
  kiyovu: '4-4-2',
  'as-kigali': '4-3-3',
  police: '4-2-3-1',
  mukura: '4-4-2',
  musanze: '4-2-3-1',
  rwanda: '4-2-3-1',
  benin: '4-4-2',
  lesotho: '4-4-2',
  'south-africa': '4-3-3',
  tanzania: '4-4-2',
}

function makeRng(seed) {
  let s = seed % 2147483647
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function isoAt(baseDate, dayOffset, hour = 15, minute = 0) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function dayKey(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* -------------------------------------------------------------------------- */
/* Generated squads                                                           */
/* -------------------------------------------------------------------------- */

const SQUAD_QUOTA = { GK: 2, DF: 6, MF: 6, FW: 4 }

function generateSquad(team, existing, rng) {
  const players = [...existing]
  const target = 18
  const usedNames = new Set(existing.map((p) => p.name))
  const usedNumbers = new Set(existing.map((p) => p.number))

  const countByPosition = (pos) => players.filter((p) => p.position === pos).length

  while (players.length < target) {
    let position = 'MF'
    let worstDeficit = -Infinity
    for (const [pos, quota] of Object.entries(SQUAD_QUOTA)) {
      const deficit = quota - countByPosition(pos)
      if (deficit > worstDeficit) {
        worstDeficit = deficit
        position = pos
      }
    }

    let name = ''
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const candidate = `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${
        LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]
      }`
      if (!usedNames.has(candidate)) {
        name = candidate
        break
      }
    }
    if (!name) name = `Academy Player ${players.length + 1}`
    usedNames.add(name)

    let number = Math.floor(rng() * 28) + 2
    while (usedNumbers.has(number)) number = (number % 30) + 1
    usedNumbers.add(number)

    const positions = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW']
    const resolvedPosition =
      position === 'FW' || position === 'MF' || position === 'DF' || position === 'GK'
        ? position
        : positions[players.length % positions.length]

    const goals =
      resolvedPosition === 'FW'
        ? Math.floor(rng() * 3)
        : resolvedPosition === 'MF'
          ? Math.floor(rng() * 3)
          : resolvedPosition === 'DF'
            ? Math.floor(rng() * 2)
            : 0

    const yearOffset = Math.floor(rng() * 11)
    players.push({
      id: `p-gen-${team.id}-${players.length + 1}`,
      name,
      teamId: team.id,
      position: resolvedPosition,
      number,
      nationality: team.national ? team.name : 'Rwanda',
      age: 19 + yearOffset,
      height: 168 + Math.floor(rng() * 22),
      foot: rng() > 0.25 ? 'Right' : 'Left',
      nationalTeam: false,
      generated: true,
      stats: {
        appearances: 4 + Math.floor(rng() * 12),
        goals,
        assists: Math.floor(rng() * 4),
        yellowCards: Math.floor(rng() * 4),
        redCards: 0,
        minutes: 320 + Math.floor(rng() * 1000),
        cleanSheets: resolvedPosition === 'GK' ? Math.floor(rng() * 5) : 0,
      },
      bio: `${name} is a ${resolvedPosition === 'GK' ? 'goalkeeper' : resolvedPosition === 'DF' ? 'defender' : resolvedPosition === 'MF' ? 'midfielder' : 'forward'} in the ${team.name} squad.`,
    })
  }

  return players
}

function buildPlayers(teams, rng) {
  const result = [...curatedPlayers]
  for (const team of teams) {
    if (team.id === 'rwanda') continue // Amavubi squad is selected by nationality
    const existing = result.filter((p) => p.teamId === team.id)
    result.push(...generateSquad(team, existing, rng).slice(existing.length))
  }
  return result
}

/* -------------------------------------------------------------------------- */
/* Lineups                                                                    */
/* -------------------------------------------------------------------------- */

function squadFor(teamId, players) {
  if (teamId === 'rwanda') {
    const national = players.filter((p) => p.nationalTeam)
    if (national.length >= 11) return national
  }
  return players.filter((p) => p.teamId === teamId)
}

function buildLineup(team, players, rng, ratingSeed = 6.2) {
  const formation = FORMATIONS[team.id] || '4-3-3'
  const tokens = formation.split('-').map(Number)
  const squad = squadFor(team.id, players)

  const byPos = {
    GK: squad.filter((p) => p.position === 'GK'),
    DF: squad.filter((p) => p.position === 'DF'),
    MF: squad.filter((p) => p.position === 'MF'),
    FW: squad.filter((p) => p.position === 'FW'),
  }
  const used = new Set()
  const take = (list, count) => {
    const out = []
    for (const p of list) {
      if (out.length >= count) break
      if (used.has(p.id)) continue
      out.push(p)
      used.add(p.id)
    }
    return out
  }

  const gk = take(byPos.GK, 1)[0] || take(squad, 1)[0]
  if (gk) used.add(gk.id)

  const defCount = tokens[0]
  const fwCount = tokens[tokens.length - 1]
  const midCount = 10 - defCount - fwCount

  const defenders = take(byPos.DF, defCount)
  const forwards = take([...byPos.FW].reverse(), fwCount).reverse()
  const midfielders = take([...byPos.MF, ...byPos.FW, ...byPos.DF], midCount)

  const rows = [{ label: 'GK', players: gk ? [gk] : [] }]
  let mfCursor = 0

  tokens.forEach((count, index) => {
    if (index === 0) {
      rows.push({ label: `${count}-back line`, players: defenders.slice(0, count) })
    } else if (index === tokens.length - 1) {
      rows.push({ label: 'Attack', players: forwards.slice(0, count) })
    } else {
      const rowPlayers = midfielders.slice(mfCursor, mfCursor + count)
      mfCursor += count
      rows.push({ label: 'Midfield', players: rowPlayers })
    }
  })

  // Defensive safety: if a row came up short, fill from any unused players.
  const allRowPlayers = rows.flatMap((row) => row.players)
  if (allRowPlayers.length < 11) {
    const extras = squad.filter((p) => !used.has(p.id) && !allRowPlayers.includes(p))
    let extraIndex = 0
    for (const row of rows) {
      while (row.players.length < (row.label === 'GK' ? 1 : 1)) {
        if (extraIndex >= extras.length) break
        row.players.push(extras[extraIndex])
        used.add(extras[extraIndex].id)
        extraIndex += 1
        break
      }
    }
    const stillNeeded = 11 - rows.flatMap((r) => r.players).length
    for (let i = 0; i < stillNeeded && extraIndex < extras.length; i += 1) {
      rows[rows.length - 1].players.push(extras[extraIndex])
      used.add(extras[extraIndex].id)
      extraIndex += 1
    }
  }

  const starters = rows.flatMap((row) => row.players).filter(Boolean)
  const bench = squad
    .filter((p) => !used.has(p.id))
    .slice(0, 9)
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      rating: Number((ratingSeed + rng() * 0.8).toFixed(1)),
    }))

  return {
    formation,
    rows: rows.map((row) => ({
      label: row.label,
      players: row.players
        .filter(Boolean)
        .map((p) => ({
          playerId: p.id,
          name: p.name,
          number: p.number,
          position: p.position,
          rating: Number((ratingSeed + rng() * 0.9).toFixed(1)),
          captain: Boolean(p.captain),
        })),
    })),
    starters: starters.map((p) => ({
      playerId: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      rating: Number((ratingSeed + rng() * 0.9).toFixed(1)),
      captain: Boolean(p.captain),
    })),
    bench,
  }
}

/* -------------------------------------------------------------------------- */
/* Match enrichment                                                           */
/* -------------------------------------------------------------------------- */

function makeGeneratedEvents(match, homeSquad, awaySquad, rng) {
  const events = []
  const teams = [
    { teamId: match.homeTeamId, squad: homeSquad, score: match.homeScore },
    { teamId: match.awayTeamId, squad: awaySquad, score: match.awayScore },
  ]
  const scorers = [homeSquad, awaySquad].map((squad) =>
    squad.filter((p) => p.position === 'FW' || p.position === 'MF'),
  )

  const goalTimes = []
  teams.forEach((team, teamIndex) => {
    for (let i = 0; i < team.score; i += 1) {
      goalTimes.push({ teamIndex, minute: 8 + Math.floor(rng() * 78) })
    }
  })
  goalTimes.sort((a, b) => a.minute - b.minute)
  goalTimes.forEach(({ teamIndex, minute }) => {
    const team = teams[teamIndex]
    const options = scorers[teamIndex]
    const scorer = options[Math.floor(rng() * options.length)]
    if (!scorer) return
    events.push({
      minute,
      type: 'goal',
      teamId: team.teamId,
      playerId: scorer.id,
      playerName: scorer.name,
      assistName: '',
      detail: rng() > 0.5 ? 'Right-footed finish' : 'Header from a cross',
    })
  })

  teams.forEach((team) => {
    const cards = 1 + Math.floor(rng() * 2)
    for (let i = 0; i < cards; i += 1) {
      const options = team.squad.filter((p) => p.position !== 'GK')
      const player = options[Math.floor(rng() * options.length)]
      if (!player) continue
      events.push({
        minute: 20 + Math.floor(rng() * 65),
        type: 'yellow',
        teamId: team.teamId,
        playerId: player.id,
        playerName: player.name,
        detail: 'Late challenge',
      })
    }
  })

  return events.sort((a, b) => a.minute - b.minute)
}

function makeStats(match, rng) {
  if (match.status === 'UPCOMING' || match.status === 'POSTPONED') return null
  const homePossession = 44 + Math.floor(rng() * 15)
  const totalGoals = match.homeScore + match.awayScore
  return {
    possession: [homePossession, 100 - homePossession],
    shots: [4 + totalGoals + Math.floor(rng() * 8), 3 + totalGoals + Math.floor(rng() * 7)],
    shotsOnTarget: [match.homeScore + Math.floor(rng() * 4), match.awayScore + Math.floor(rng() * 3)],
    corners: [2 + Math.floor(rng() * 6), 2 + Math.floor(rng() * 6)],
    fouls: [6 + Math.floor(rng() * 9), 6 + Math.floor(rng() * 9)],
    yellow: [Math.floor(rng() * 4), Math.floor(rng() * 4)],
    red: [0, 0],
  }
}

const DEFAULT_PHOTOS = [
  { url: PHOTO_ACTION, caption: 'Aerial duel in midfield' },
  { url: PHOTO_STADIUM, caption: 'Supporters fill the stands' },
  { url: PHOTO_CROWD, caption: 'Colour and noise from the terraces' },
]

function enrichMatch(match, { teams, players, rng }) {
  const home = teams.find((t) => t.id === match.homeTeamId)
  const away = teams.find((t) => t.id === match.awayTeamId)
  const homeSquad = squadFor(match.homeTeamId, players)
  const awaySquad = squadFor(match.awayTeamId, players)

  const isPlayed = match.status === 'FT' || match.status === 'LIVE' || match.status === 'HT'
  if (!isPlayed) {
    return {
      ...match,
      events: match.events || [],
      stats: null,
      lineups: null,
      photos: [],
      highlights: [],
      homeTeam: home,
      awayTeam: away,
    }
  }

  const lineupHome =
    match.lineups?.home || buildLineup(home, players, rng, match.status === 'LIVE' ? 6.4 : 6.1)
  const lineupAway =
    match.lineups?.away || buildLineup(away, players, rng, match.status === 'LIVE' ? 6.3 : 6.1)

  const events =
    match.events && match.events.length
      ? match.events
      : makeGeneratedEvents(match, homeSquad, awaySquad, rng)

  return {
    ...match,
    homeTeam: home,
    awayTeam: away,
    events,
    stats: match.stats || makeStats(match, rng),
    lineups: { home: lineupHome, away: lineupAway },
    photos: match.photos?.length ? match.photos : DEFAULT_PHOTOS,
    highlights:
      match.highlights !== undefined
        ? match.highlights
        : match.status === 'FT'
          ? [
              { title: 'Extended highlights', duration: '4:12' },
              { title: 'All goals', duration: '1:38' },
            ]
          : [],
  }
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                       */
/* -------------------------------------------------------------------------- */

export function buildDatabase(now = new Date()) {
  const rng = makeRng(20260214)
  const players = buildPlayers(teamsData, rng)

  const rawMatches = [
    {
      id: 'm-live-apr-rayon',
      competitionId: 'rwanda-premier-league',
      round: 'Matchday 19',
      date: isoAt(now, 0, 16, 0),
      status: 'LIVE',
      minute: 67,
      homeTeamId: 'apr',
      awayTeamId: 'rayon',
      homeScore: 2,
      awayScore: 1,
      venue: 'Amahoro Stadium',
      city: 'Kigali',
      referee: 'Salima Mukansanga',
      attendance: 18500,
      events: [
        { minute: 12, type: 'goal', teamId: 'apr', playerId: 'p-kevin-muhire', playerName: 'Kevin Muhire', assistName: 'Patrick Sibomana', detail: 'Strike from the edge of the box' },
        { minute: 34, type: 'yellow', teamId: 'rayon', playerId: 'p-eric-iradukunda', playerName: 'Eric Iradukunda', detail: 'Tactical foul' },
        { minute: 45, type: 'goal', teamId: 'apr', playerId: 'p-gilbert-mugisha', playerName: 'Gilbert Mugisha', assistName: 'Emmanuel Imanishimwe', detail: 'Close-range finish after a low cross' },
        { minute: 61, type: 'goal', teamId: 'rayon', playerId: 'p-innocent-nshuti', playerName: 'Innocent Nshuti', assistName: 'Jules Ulimwengu', detail: 'Header from the six-yard box' },
        { minute: 63, type: 'yellow', teamId: 'rayon', playerId: 'p-shaban-bwira', playerName: 'Shaban Bwira', detail: 'Late challenge' },
        { minute: 64, type: 'sub', teamId: 'rayon', playerId: 'p-cedric-ndizeye', playerName: 'Cedric Ndizeye', playerOut: 'Jules Ulimwengu', detail: 'Cedric Ndizeye on for Jules Ulimwengu' },
        { minute: 66, type: 'sub', teamId: 'apr', playerId: 'p-ramadhan-niyibizi', playerName: 'Ramadhan Niyibizi', playerOut: 'Olivier Niyonzima', detail: 'Ramadhan Niyibizi on for Olivier Niyonzima' },
      ],
      stats: {
        possession: [56, 44],
        shots: [12, 8],
        shotsOnTarget: [6, 3],
        corners: [5, 3],
        fouls: [9, 12],
        yellow: [0, 2],
        red: [0, 0],
      },
      photos: [
        { url: PHOTO_ACTION, caption: 'Kevin Muhire drives at the Rayon defence' },
        { url: PHOTO_CROWD, caption: 'The Blue Army in full voice at Amahoro' },
        { url: PHOTO_STADIUM, caption: 'Derby day in Kigali' },
      ],
      highlights: [],
    },
    {
      id: 'm-live-kiyovu-police',
      competitionId: 'rwanda-premier-league',
      round: 'Matchday 19',
      date: isoAt(now, 0, 16, 0),
      status: 'LIVE',
      minute: 52,
      homeTeamId: 'kiyovu',
      awayTeamId: 'police',
      homeScore: 1,
      awayScore: 1,
      venue: 'Mumena Stadium',
      city: 'Kigali',
      referee: 'Samuel Uwikunda',
      attendance: 4200,
      events: [
        { minute: 18, type: 'goal', teamId: 'kiyovu', playerId: 'p-emmanuel-mugisha', playerName: 'Emmanuel Mugisha', assistName: 'Blaise Nishimwe', detail: 'First-time finish inside the area' },
        { minute: 33, type: 'yellow', teamId: 'kiyovu', playerId: 'p-fabrice-ndayisenga', playerName: 'Fabrice Ndayisenga', detail: 'Holding' },
        { minute: 44, type: 'goal', teamId: 'police', playerId: 'p-fabrice-nsengimana', playerName: 'Fabrice Nsengimana', assistName: 'Moses Kagabo', detail: 'Low drive from the right channel' },
        { minute: 46, type: 'yellow', teamId: 'police', playerId: 'p-pascal-niyonkuru', playerName: 'Pascal Niyonkuru', detail: 'Dissent' },
      ],
      stats: {
        possession: [51, 49],
        shots: [7, 6],
        shotsOnTarget: [3, 3],
        corners: [3, 4],
        fouls: [7, 10],
        yellow: [1, 1],
        red: [0, 0],
      },
      highlights: [],
    },
    { id: 'm-today-musanze-gasogi', competitionId: 'rwanda-premier-league', round: 'Matchday 19', date: isoAt(now, 0, 12, 0), status: 'FT', minute: 90, homeTeamId: 'musanze', awayTeamId: 'gasogi', homeScore: 1, awayScore: 0, venue: 'Ubworoherane Stadium', city: 'Musanze', referee: 'Jean-Claude Niyonzima', attendance: 2800 },
    { id: 'm-today-bugesera-gorilla', competitionId: 'rwanda-premier-league', round: 'Matchday 19', date: isoAt(now, 0, 12, 0), status: 'FT', minute: 90, homeTeamId: 'bugesera', awayTeamId: 'gorilla', homeScore: 0, awayScore: 2, venue: 'Nyamata Stadium', city: 'Nyamata', referee: 'Adolphe Nshimiyimana', attendance: 1600 },
    { id: 'm-today-ask-mukura', competitionId: 'rwanda-premier-league', round: 'Matchday 19', date: isoAt(now, 0, 18, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'as-kigali', awayTeamId: 'mukura', homeScore: 0, awayScore: 0, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Louis Hakizimana', attendance: null },
    { id: 'm-today-marines-etincelles', competitionId: 'rwanda-premier-league', round: 'Matchday 19', date: isoAt(now, 0, 20, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'marines', awayTeamId: 'etincelles', homeScore: 0, awayScore: 0, venue: 'Umuganda Stadium', city: 'Rubavu', referee: 'Salima Mukansanga', attendance: null },

    { id: 'm-1-apr-ask', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'apr', awayTeamId: 'as-kigali', homeScore: 1, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Jean-Claude Niyonzima', attendance: 9200 },
    { id: 'm-1-rayon-mukura', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'rayon', awayTeamId: 'mukura', homeScore: 3, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Adolphe Nshimiyimana', attendance: 7100 },
    { id: 'm-1-police-kiyovu', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'police', awayTeamId: 'kiyovu', homeScore: 2, awayScore: 2, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Samuel Uwikunda', attendance: 3900 },
    { id: 'm-1-etincelles-musanze', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'etincelles', awayTeamId: 'musanze', homeScore: 0, awayScore: 1, venue: 'Umuganda Stadium', city: 'Rubavu', referee: 'Louis Hakizimana', attendance: 2100 },
    { id: 'm-1-bugesera-rutsiro', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'bugesera', awayTeamId: 'rutsiro', homeScore: 1, awayScore: 1, venue: 'Nyamata Stadium', city: 'Nyamata', referee: 'Jean-Claude Niyonzima', attendance: 1400 },
    { id: 'm-1-gorilla-vision', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'gorilla', awayTeamId: 'vision', homeScore: 2, awayScore: 1, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Salima Mukansanga', attendance: 2200 },
    { id: 'm-1-amagaju-marines', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'amagaju', awayTeamId: 'marines', homeScore: 1, awayScore: 1, venue: 'Huye Stadium', city: 'Huye', referee: 'Adolphe Nshimiyimana', attendance: 1800 },
    { id: 'm-1-kirehe-gasogi', competitionId: 'rwanda-premier-league', round: 'Matchday 18', date: isoAt(now, -1, 15, 0), status: 'FT', minute: 90, homeTeamId: 'kirehe', awayTeamId: 'gasogi', homeScore: 0, awayScore: 2, venue: 'Kirehe Stadium', city: 'Kirehe', referee: 'Samuel Uwikunda', attendance: 900 },

    { id: 'm1-ask-apr', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'as-kigali', awayTeamId: 'apr', homeScore: 0, awayScore: 0, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Salima Mukansanga' },
    { id: 'm1-mukura-police', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'mukura', awayTeamId: 'police', homeScore: 0, awayScore: 0, venue: 'Huye Stadium', city: 'Huye', referee: 'Jean-Claude Niyonzima' },
    { id: 'm1-kiyovu-rayon', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 17, 30), status: 'UPCOMING', minute: 0, homeTeamId: 'kiyovu', awayTeamId: 'rayon', homeScore: 0, awayScore: 0, venue: 'Mumena Stadium', city: 'Kigali', referee: 'Samuel Uwikunda' },
    { id: 'm1-musanze-bugesera', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'musanze', awayTeamId: 'bugesera', homeScore: 0, awayScore: 0, venue: 'Ubworoherane Stadium', city: 'Musanze', referee: 'Adolphe Nshimiyimana' },
    { id: 'm1-gasogi-etincelles', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'gasogi', awayTeamId: 'etincelles', homeScore: 0, awayScore: 0, venue: 'Kigali Stadium', city: 'Kigali', referee: 'Louis Hakizimana' },
    { id: 'm1-gorilla-amagaju', competitionId: 'rwanda-premier-league', round: 'Matchday 20', date: isoAt(now, 1, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'gorilla', awayTeamId: 'amagaju', homeScore: 0, awayScore: 0, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Salima Mukansanga' },

    { id: 'm2-apr-musanze', competitionId: 'rwanda-premier-league', round: 'Matchday 21', date: isoAt(now, 2, 18, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'apr', awayTeamId: 'musanze', homeScore: 0, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Jean-Claude Niyonzima' },
    { id: 'm2-rayon-ask', competitionId: 'rwanda-premier-league', round: 'Matchday 21', date: isoAt(now, 2, 18, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'rayon', awayTeamId: 'as-kigali', homeScore: 0, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Salima Mukansanga' },
    { id: 'm2-mukura-rutsiro', competitionId: 'rwanda-premier-league', round: 'Matchday 21', date: isoAt(now, 2, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'mukura', awayTeamId: 'rutsiro', homeScore: 0, awayScore: 0, venue: 'Huye Stadium', city: 'Huye', referee: 'Louis Hakizimana' },
    { id: 'm2-vision-marines', competitionId: 'rwanda-premier-league', round: 'Matchday 21', date: isoAt(now, 2, 15, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'vision', awayTeamId: 'marines', homeScore: 0, awayScore: 0, venue: 'Nyamirambo Stadium', city: 'Kigali', referee: 'Adolphe Nshimiyimana' },

    { id: 'm-cup-sf-apr-ask', competitionId: 'peace-cup', round: 'Semi-final', date: isoAt(now, -4, 15, 0), status: 'FT', minute: 90, homeTeamId: 'apr', awayTeamId: 'as-kigali', homeScore: 3, awayScore: 1, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Samuel Uwikunda', attendance: 11300 },
    { id: 'm-cup-sf-mukura-rayon', competitionId: 'peace-cup', round: 'Semi-final', date: isoAt(now, -4, 18, 0), status: 'FT', minute: 90, homeTeamId: 'mukura', awayTeamId: 'rayon', homeScore: 1, awayScore: 0, venue: 'Huye Stadium', city: 'Huye', referee: 'Jean-Claude Niyonzima', attendance: 6500 },
    { id: 'm-cup-qf-apr-gasogi', competitionId: 'peace-cup', round: 'Quarter-final', date: isoAt(now, -8, 15, 0), status: 'FT', minute: 90, homeTeamId: 'apr', awayTeamId: 'gasogi', homeScore: 2, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Salima Mukansanga', attendance: 8200 },
    { id: 'm-cup-qf-ask-kiyovu', competitionId: 'peace-cup', round: 'Quarter-final', date: isoAt(now, -8, 15, 0), status: 'FT', minute: 90, homeTeamId: 'as-kigali', awayTeamId: 'kiyovu', homeScore: 1, awayScore: 0, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Louis Hakizimana', attendance: 4100 },
    { id: 'm-cup-qf-mukura-police', competitionId: 'peace-cup', round: 'Quarter-final', date: isoAt(now, -8, 15, 0), status: 'FT', minute: 90, homeTeamId: 'mukura', awayTeamId: 'police', homeScore: 2, awayScore: 1, venue: 'Huye Stadium', city: 'Huye', referee: 'Adolphe Nshimiyimana', attendance: 3600 },
    { id: 'm-cup-qf-rayon-musanze', competitionId: 'peace-cup', round: 'Quarter-final', date: isoAt(now, -8, 15, 0), status: 'FT', minute: 90, homeTeamId: 'rayon', awayTeamId: 'musanze', homeScore: 3, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Samuel Uwikunda', attendance: 7800 },
    { id: 'm-cup-final', competitionId: 'peace-cup', round: 'Final', date: isoAt(now, 4, 18, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'apr', awayTeamId: 'mukura', homeScore: 0, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Salima Mukansanga', attendance: null },

    { id: 'm-amv-rwa-les', competitionId: 'amavubi', round: 'AFCON 2027 Qualifier', date: isoAt(now, -7, 18, 0), status: 'FT', minute: 90, homeTeamId: 'rwanda', awayTeamId: 'lesotho', homeScore: 2, awayScore: 1, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Mohamed Ali', attendance: 21400 },
    { id: 'm-amv-rwa-rsa', competitionId: 'amavubi', round: 'FIFA World Cup Qualifier', date: isoAt(now, -21, 18, 0), status: 'FT', minute: 90, homeTeamId: 'rwanda', awayTeamId: 'south-africa', homeScore: 0, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Bakary Gassama', attendance: 19600 },
    { id: 'm-amv-rwa-ben', competitionId: 'amavubi', round: 'AFCON 2027 Qualifier', date: isoAt(now, 5, 18, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'rwanda', awayTeamId: 'benin', homeScore: 0, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Ahmad Heeralall', attendance: null },
    { id: 'm-amv-rwa-tan', competitionId: 'amavubi', round: 'International Friendly', date: isoAt(now, 12, 16, 0), status: 'UPCOMING', minute: 0, homeTeamId: 'rwanda', awayTeamId: 'tanzania', homeScore: 0, awayScore: 0, venue: 'Huye Stadium', city: 'Huye', referee: 'Jean-Claude Niyonzima', attendance: null },

    { id: 'm-14-apr-police', competitionId: 'rwanda-premier-league', round: 'Matchday 17', date: isoAt(now, -14, 15, 0), status: 'FT', minute: 90, homeTeamId: 'apr', awayTeamId: 'police', homeScore: 2, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Samuel Uwikunda', attendance: 8700 },
    { id: 'm-14-rayon-kiyovu', competitionId: 'rwanda-premier-league', round: 'Matchday 17', date: isoAt(now, -14, 15, 0), status: 'FT', minute: 90, homeTeamId: 'rayon', awayTeamId: 'kiyovu', homeScore: 1, awayScore: 0, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Salima Mukansanga', attendance: 10300 },
    { id: 'm-14-ask-musanze', competitionId: 'rwanda-premier-league', round: 'Matchday 17', date: isoAt(now, -14, 15, 0), status: 'FT', minute: 90, homeTeamId: 'as-kigali', awayTeamId: 'musanze', homeScore: 2, awayScore: 2, venue: 'Kigali Pelé Stadium', city: 'Kigali', referee: 'Louis Hakizimana', attendance: 3200 },
    { id: 'm-14-mukura-gasogi', competitionId: 'rwanda-premier-league', round: 'Matchday 17', date: isoAt(now, -14, 15, 0), status: 'FT', minute: 90, homeTeamId: 'mukura', awayTeamId: 'gasogi', homeScore: 1, awayScore: 0, venue: 'Huye Stadium', city: 'Huye', referee: 'Adolphe Nshimiyimana', attendance: 2900 },
    { id: 'm-21-apr-bugesera', competitionId: 'rwanda-premier-league', round: 'Matchday 16', date: isoAt(now, -21, 15, 0), status: 'FT', minute: 90, homeTeamId: 'apr', awayTeamId: 'bugesera', homeScore: 3, awayScore: 1, venue: 'Amahoro Stadium', city: 'Kigali', referee: 'Jean-Claude Niyonzima', attendance: 8100 },
    { id: 'm-21-marines-rayon', competitionId: 'rwanda-premier-league', round: 'Matchday 16', date: isoAt(now, -21, 15, 0), status: 'FT', minute: 90, homeTeamId: 'marines', awayTeamId: 'rayon', homeScore: 0, awayScore: 2, venue: 'Umuganda Stadium', city: 'Rubavu', referee: 'Salima Mukansanga', attendance: 3100 },
  ]

  const enriched = rawMatches.map((match) => enrichMatch(match, { teams: teamsData, players, rng }))

  return {
    version: 1,
    seedDate: dayKey(now),
    createdAt: now.toISOString(),
    teams: teamsData,
    competitions: competitionsData,
    players,
    matches: enriched,
    news: newsData.map((article) => ({
      ...article,
      publishedAt: new Date(now.getTime() - article.minutesAgo * 60000).toISOString(),
    })),
    standings: standingsData,
    users: usersData.map((user) => ({
      ...user,
      lastActive: new Date(now.getTime() - user.lastActiveMinutes * 60000).toISOString(),
    })),
    activity: activityData.map((entry) => ({
      ...entry,
      createdAt: new Date(now.getTime() - entry.minutesAgo * 60000).toISOString(),
    })),
    presence: presenceData,
  }
}

export { dayKey }
