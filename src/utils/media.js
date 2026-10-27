export function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function positionKey(position) {
  const keys = {
    GK: 'players.goalkeeper',
    DF: 'players.defender',
    MF: 'players.midfielder',
    FW: 'players.forward',
  }
  return keys[position] || 'common.unknown'
}

export function statusKey(status) {
  const keys = {
    LIVE: 'common.live',
    HT: 'common.ht',
    FT: 'common.ft',
    UPCOMING: 'common.upcoming',
    POSTPONED: 'common.postponed',
  }
  return keys[status] || 'common.upcoming'
}

export function isLiveStatus(status) {
  return status === 'LIVE' || status === 'HT'
}

export function resultTone(teamId, match) {
  if (!match || !['FT'].includes(match.status)) return null
  if (match.homeScore === match.awayScore) return 'D'
  const homeWin = match.homeScore > match.awayScore
  return (teamId === match.homeTeamId) === homeWin ? 'W' : 'L'
}
