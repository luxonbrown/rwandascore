const iso = (value) => (value ? new Date(value).toISOString() : null);

export function serializeTeam(team) {
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    initials: team.initials,
    slug: team.slug,
    city: team.city,
    stadiumId: team.stadiumId ?? null,
    stadium: team.stadium?.name ?? null,
    founded: team.founded ?? null,
    nickname: team.nickname ?? null,
    coach: team.coach ?? null,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    colors: {
      primary: team.primaryColor,
      secondary: team.secondaryColor,
    },
    logoUrl: team.logoUrl ?? null,
    isNational: team.isNational,
    description: team.description ?? null,
    createdAt: iso(team.createdAt),
    updatedAt: iso(team.updatedAt),
  };
}

export function serializeStadium(stadium) {
  if (!stadium) return null;

  return {
    id: stadium.id,
    name: stadium.name,
    city: stadium.city,
    capacity: stadium.capacity ?? null,
    createdAt: iso(stadium.createdAt),
    updatedAt: iso(stadium.updatedAt),
  };
}

export function serializeCompetition(competition) {
  if (!competition) return null;

  return {
    id: competition.id,
    name: competition.name,
    shortName: competition.shortName,
    slug: competition.slug,
    country: competition.country,
    type: competition.type,
    logoUrl: competition.logoUrl ?? null,
    logoText: competition.logoText ?? null,
    color: competition.primaryColor,
    primaryColor: competition.primaryColor,
    secondaryColor: competition.secondaryColor,
    colors: {
      primary: competition.primaryColor,
      secondary: competition.secondaryColor,
    },
    description: competition.description ?? null,
    teamCount: competition.teamCount,
    createdAt: iso(competition.createdAt),
    updatedAt: iso(competition.updatedAt),
  };
}

export function serializeSeason(season) {
  if (!season) return null;

  return {
    id: season.id,
    competitionId: season.competitionId,
    name: season.name,
    startDate: iso(season.startDate),
    endDate: iso(season.endDate),
    isCurrent: season.isCurrent,
    createdAt: iso(season.createdAt),
    updatedAt: iso(season.updatedAt),
  };
}

export function serializePlayer(player, stats = undefined) {
  if (!player) return null;

  const age = player.dateOfBirth
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
        ),
      )
    : null;

  return {
    id: player.id,
    name: player.name,
    slug: player.slug,
    teamId: player.teamId ?? null,
    team: player.team ? serializeTeam(player.team) : null,
    position: player.position,
    number: player.number ?? null,
    nationality: player.nationality,
    dateOfBirth: iso(player.dateOfBirth),
    age: player.age ?? age,
    height: player.height ?? null,
    foot: player.foot ?? null,
    photoUrl: player.photoUrl ?? null,
    isNationalTeam: player.isNationalTeam,
    bio: player.bio ?? null,
    stats: stats ?? {
      goals: player.goals ?? 0,
      assists: player.assists ?? 0,
      appearances: player.appearances ?? 0,
      yellow: player.yellowCards ?? 0,
      red: player.redCards ?? 0,
      yellowCards: player.yellowCards ?? 0,
      redCards: player.redCards ?? 0,
      minutes: player.minutes ?? 0,
      cleanSheets: player.cleanSheets ?? 0,
    },
    createdAt: iso(player.createdAt),
    updatedAt: iso(player.updatedAt),
  };
}

export function serializeEvent(event) {
  if (!event) return null;

  return {
    id: event.id,
    matchId: event.matchId,
    teamId: event.teamId ?? null,
    team: event.team ? serializeTeam(event.team) : null,
    playerId: event.playerId ?? null,
    player: event.player?.name ?? null,
    playerName: event.player?.name ?? null,
    playerNumber: event.player?.number ?? null,
    relatedPlayerId: event.relatedPlayerId ?? null,
    relatedPlayer: event.relatedPlayer?.name ?? null,
    type: event.type,
    minute: event.minute,
    note: event.note ?? null,
    x: event.x ?? null,
    y: event.y ?? null,
    createdAt: iso(event.createdAt),
  };
}

export function serializeMatch(match, { includeEvents = false } = {}) {
  if (!match) return null;

  const kickoffAt = iso(match.kickoffAt);
  const stadiumName = match.stadium?.name ?? match.venue ?? null;

  return {
    id: match.id,
    competitionId: match.competitionId,
    competition: match.competition ? serializeCompetition(match.competition) : null,
    seasonId: match.seasonId,
    season: match.season ? serializeSeason(match.season) : null,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeam: match.homeTeam ? serializeTeam(match.homeTeam) : null,
    awayTeam: match.awayTeam ? serializeTeam(match.awayTeam) : null,
    kickoffAt,
    date: kickoffAt,
    status: match.status,
    minute: match.minute,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    round: match.round ?? null,
    venue: match.venue ?? stadiumName,
    stadium: stadiumName,
    stadiumId: match.stadiumId ?? null,
    city: match.city ?? match.stadium?.city ?? null,
    referee: match.referee ?? null,
    attendance: match.attendance ?? null,
    version: match.version,
    events: includeEvents ? (match.events ?? []).map(serializeEvent) : undefined,
    stats: match.stats ?? null,
    lineups: match.lineups ?? null,
    photos: [],
    highlights: [],
    createdAt: iso(match.createdAt),
    updatedAt: iso(match.updatedAt),
  };
}

export function standingZone(position, totalTeams) {
  if (!position || !totalTeams) return null;
  if (position <= 2) return 'caf-champions-league';
  if (position === 3) return 'caf-confederation-cup';
  if (position > Math.max(3, totalTeams - 3)) return 'relegation';
  return null;
}

export function serializeStanding(row, totalTeams = undefined) {
  if (!row) return null;

  const goalDifference = row.goalsFor - row.goalsAgainst;
  const form = row.form ? row.form.split('') : [];

  return {
    id: row.id,
    seasonId: row.seasonId,
    teamId: row.teamId,
    team: row.team ? serializeTeam(row.team) : null,
    position: row.position,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference,
    gf: row.goalsFor,
    ga: row.goalsAgainst,
    gd: goalDifference,
    points: row.points,
    form,
    isLive: Boolean(row.isLive),
    zone: standingZone(row.position, totalTeams),
    updatedAt: iso(row.updatedAt),
  };
}

export function serializeNews(article, { includeContent = false } = {}) {
  if (!article) return null;

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    ...(includeContent ? { content: article.content } : {}),
    category: article.category,
    imageUrl: article.imageUrl ?? null,
    authorId: article.authorId ?? null,
    author: article.author?.name ?? null,
    authorRole: article.author?.role ?? null,
    status: article.status,
    featured: article.featured,
    publishedAt: iso(article.publishedAt),
    views: article.views,
    createdAt: iso(article.createdAt),
    updatedAt: iso(article.updatedAt),
  };
}

export function serializeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.managedTeam?.id ?? null,
    teamName: user.managedTeam?.name ?? null,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: iso(user.lastLoginAt),
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
  };
}

export function serializeActivity(log) {
  if (!log) return null;

  return {
    id: log.id,
    userId: log.userId ?? null,
    user: log.user?.name ?? 'System',
    role: log.user?.role ?? null,
    action: log.action,
    module: log.module,
    recordType: log.recordType ?? null,
    recordId: log.recordId ?? null,
    record: log.recordType ? `${log.recordType} ${log.recordId ?? ''}`.trim() : '—',
    description: log.description,
    ip: log.ipAddress ?? null,
    ipAddress: log.ipAddress ?? null,
    createdAt: iso(log.createdAt),
  };
}

export function serializeScorer(entry) {
  return {
    rank: entry.rank,
    player: entry.player,
    team: entry.team,
    goals: entry.goals,
    assists: entry.assists ?? 0,
    appearances: entry.appearances ?? 0,
  };
}
