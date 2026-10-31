const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '')

function uploadsOrigin() {
  try {
    return new URL(configuredApiUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').origin
  } catch {
    return 'http://localhost:4000'
  }
}

export function playerPhotoUrl(playerOrUrl) {
  const raw = typeof playerOrUrl === 'string'
    ? playerOrUrl
    : playerOrUrl?.faceId || playerOrUrl?.photoUrl || playerOrUrl?.photo || ''
  if (!raw || typeof raw !== 'string') return ''
  try {
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)
    if (url.pathname.startsWith('/uploads/') && (isLocalHost || raw.startsWith('/uploads/'))) {
      return `${uploadsOrigin()}${url.pathname}${url.search}${url.hash}`
    }
    return url.href
  } catch {
    return raw
  }
}

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
