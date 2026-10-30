import { prisma } from '../config/prisma.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { serializeMatch } from '../utils/serializers.js';
import { logActivity } from './activity.service.js';
import { recalculateStandings } from './standings.service.js';
import { broadcast } from '../ws/live.js';

export const matchInclude = {
  competition: true,
  season: { select: { id: true, name: true, isCurrent: true, competitionId: true } },
  homeTeam: { include: { stadium: true } },
  awayTeam: { include: { stadium: true } },
  stadium: true,
};

export const matchDetailInclude = {
  ...matchInclude,
  events: {
    include: {
      player: true,
      relatedPlayer: true,
      team: true,
    },
    orderBy: [{ minute: 'asc' }, { createdAt: 'asc' }],
  },
};

const EDITABLE_FIELDS = [
  'competitionId',
  'seasonId',
  'homeTeamId',
  'awayTeamId',
  'kickoffAt',
  'status',
  'minute',
  'round',
  'venue',
  'city',
  'stadiumId',
  'referee',
  'attendance',
];

function defaultMinute(status) {
  if (status === 'ft') return 90;
  if (status === 'ht') return 45;
  if (status === 'live') return 1;
  return 0;
}

async function assertMatchReferences(client, data) {
  const [competition, season, homeTeam, awayTeam, stadium] = await Promise.all([
    client.competition.findUnique({ where: { id: data.competitionId } }),
    client.season.findUnique({ where: { id: data.seasonId } }),
    client.team.findUnique({ where: { id: data.homeTeamId } }),
    client.team.findUnique({ where: { id: data.awayTeamId } }),
    data.stadiumId ? client.stadium.findUnique({ where: { id: data.stadiumId } }) : null,
  ]);

  if (!competition) throw badRequest('Competition not found');
  if (!season) throw badRequest('Season not found');
  if (season.competitionId !== competition.id) {
    throw badRequest('Season does not belong to the selected competition');
  }
  if (!homeTeam) throw badRequest('Home team not found');
  if (!awayTeam) throw badRequest('Away team not found');
  if (homeTeam.id === awayTeam.id) throw badRequest('A team cannot play itself');
  if (data.stadiumId && !stadium) throw badRequest('Stadium not found');
}

function pickDefined(data, fields) {
  const result = {};
  for (const field of fields) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
}

function scoreDelta(type, teamId, match) {
  if (type === 'goal' || type === 'penalty') {
    return teamId === match.homeTeamId ? { home: 1, away: 0 } : { home: 0, away: 1 };
  }
  if (type === 'own_goal') {
    return teamId === match.homeTeamId ? { home: 0, away: 1 } : { home: 1, away: 0 };
  }
  return { home: 0, away: 0 };
}

async function emitMatchUpdate(matchId, { includeEvents = true } = {}) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: matchDetailInclude,
  });

  if (!match) return null;

  broadcast('match:update', { match: serializeMatch(match, { includeEvents }) });
  broadcast('standings:update', {
    competitionId: match.competitionId,
    seasonId: match.seasonId,
  });

  return match;
}

export async function listMatches({
  page = 1,
  pageSize = 20,
  competitionId,
  teamId,
  status,
  date,
  from,
  to,
  round,
  search,
  sort = 'kickoffAt',
  order = 'desc',
}) {
  const where = {};

  if (competitionId) where.competitionId = competitionId;
  if (teamId) where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
  if (status) where.status = status;
  if (round) where.round = round;

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    where.kickoffAt = { gte: start, lte: end };
  } else if (from || to) {
    where.kickoffAt = {};
    if (from) where.kickoffAt.gte = new Date(from);
    if (to) where.kickoffAt.lte = new Date(to);
  }

  if (search) {
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { homeTeam: { name: { contains: search } } },
          { awayTeam: { name: { contains: search } } },
          { venue: { contains: search } },
        ],
      },
    ];
  }

  const [total, matches] = await Promise.all([
    prisma.match.count({ where }),
    prisma.match.findMany({
      where,
      include: matchInclude,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: matches.map((match) => serializeMatch(match)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLiveMatches() {
  const matches = await prisma.match.findMany({
    where: { status: { in: ['live', 'ht'] } },
    include: matchInclude,
    orderBy: { kickoffAt: 'desc' },
  });

  return matches.map((match) => serializeMatch(match));
}

export async function getMatch(id) {
  const match = await prisma.match.findUnique({
    where: { id },
    include: matchDetailInclude,
  });

  if (!match) throw notFound('Match not found');

  return serializeMatch(match, { includeEvents: true });
}

export async function getHeadToHead(homeTeamId, awayTeamId, limit = 10) {
  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: homeTeamId } }),
    prisma.team.findUnique({ where: { id: awayTeamId } }),
  ]);

  if (!homeTeam) throw notFound('Home team not found');
  if (!awayTeam) throw notFound('Away team not found');

  const matches = await prisma.match.findMany({
    where: {
      status: 'ft',
      OR: [
        { homeTeamId, awayTeamId },
        { homeTeamId: awayTeamId, awayTeamId: homeTeamId },
      ],
    },
    include: matchInclude,
    orderBy: { kickoffAt: 'desc' },
    take: limit,
  });

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  for (const match of matches) {
    if (match.homeScore === match.awayScore) {
      draws += 1;
      continue;
    }
    const winnerId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    if (winnerId === homeTeamId) homeWins += 1;
    else awayWins += 1;
  }

  return {
    homeTeam,
    awayTeam,
    summary: {
      played: matches.length,
      homeWins,
      awayWins,
      draws,
    },
    matches: matches.map((match) => serializeMatch(match)),
  };
}

export async function createMatch(data, actor, ipAddress = null) {
  await assertMatchReferences(prisma, data);
  if (data.lineups && (data.status ?? 'scheduled') !== 'scheduled') {
    throw badRequest('Lineups can only be set for an upcoming match');
  }

  const created = await prisma.$transaction(async (tx) => {
    const storedLineups = data.lineups
      ? await buildStoredLineups(tx, data.lineups, data.homeTeamId, data.awayTeamId)
      : undefined;
    const match = await tx.match.create({
      data: {
        competitionId: data.competitionId,
        seasonId: data.seasonId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        kickoffAt: data.kickoffAt,
        status: data.status ?? 'scheduled',
        minute: data.minute ?? defaultMinute(data.status ?? 'scheduled'),
        round: data.round ?? null,
        venue: data.venue ?? null,
        city: data.city ?? null,
        stadiumId: data.stadiumId ?? null,
        referee: data.referee ?? null,
        attendance: data.attendance ?? null,
        ...(storedLineups ? { lineups: storedLineups } : {}),
      },
    });

    await recalculateStandings(tx, match.seasonId);

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Matches',
      recordType: 'match',
      recordId: match.id,
      description: `Created match ${match.id}`,
      ipAddress,
    });

    return match;
  });

  const full = await emitMatchUpdate(created.id);
  return serializeMatch(full, { includeEvents: true });
}

export async function updateMatch(id, data, actor, ipAddress = null) {
  if (data.homeScore !== undefined || data.awayScore !== undefined) {
    throw conflict(
      'Scores are managed by match events and cannot be edited directly',
      'SCORE_MANAGED_BY_EVENTS',
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.match.findUnique({ where: { id }, include: matchInclude });
    if (!current) throw notFound('Match not found');

    if (data.version === undefined || Number(data.version) !== current.version) {
      throw conflict(
        'This match was changed by someone else. Reload it and try again.',
        'MATCH_VERSION_CONFLICT',
        { current: serializeMatch(current, { includeEvents: true }) },
      );
    }

    const merged = {
      competitionId: data.competitionId ?? current.competitionId,
      seasonId: data.seasonId ?? current.seasonId,
      homeTeamId: data.homeTeamId ?? current.homeTeamId,
      awayTeamId: data.awayTeamId ?? current.awayTeamId,
      stadiumId: data.stadiumId !== undefined ? data.stadiumId : current.stadiumId,
    };

    await assertMatchReferences(tx, merged);

    const updateData = pickDefined(data, EDITABLE_FIELDS);
    delete updateData.version;

    if (data.kickoffAt !== undefined) updateData.kickoffAt = new Date(data.kickoffAt);
    if (data.status !== undefined && data.minute === undefined) {
      updateData.minute = defaultMinute(data.status);
    }

    const changed = await tx.match.updateMany({
      where: { id, version: current.version },
      data: { ...updateData, version: current.version + 1 },
    });

    if (changed.count === 0) {
      throw conflict(
        'This match was changed by someone else. Reload it and try again.',
        'MATCH_VERSION_CONFLICT',
      );
    }

    await recalculateStandings(tx, current.seasonId);
    if (merged.seasonId !== current.seasonId) {
      await recalculateStandings(tx, merged.seasonId);
    }

    const fields = Object.keys(updateData)
      .filter((field) => field !== 'version')
      .map((field) => `${field}: ${current[field]} → ${updateData[field]}`);

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Matches',
      recordType: 'match',
      recordId: id,
      description: `Updated match ${id}${fields.length ? ` (${fields.join(', ')})` : ''}`,
      ipAddress,
    });

    return { matchId: id };
  });

  const full = await emitMatchUpdate(result.matchId);
  return serializeMatch(full, { includeEvents: true });
}

function formatLineupSide(lineup, playerMap) {
  const rowSizes = [1, ...lineup.formation.split('-').map(Number)];
  let index = 0;
  const rows = rowSizes.map((size, rowIndex) => {
    const playerIds = lineup.starters.slice(index, index + size);
    index += size;
    return {
      label: rowIndex === 0 ? 'GK' : `line-${rowIndex}`,
      players: playerIds.map((playerId) => {
        const player = playerMap.get(playerId);
        return {
          playerId: player.id,
          name: player.name,
          number: player.number ?? '',
          position: player.position,
          rating: null,
        };
      }),
    };
  }).filter((row) => row.players.length);

  return {
    formation: lineup.formation,
    rows,
    bench: lineup.bench.map((playerId) => {
      const player = playerMap.get(playerId);
      return {
        playerId: player.id,
        name: player.name,
        number: player.number ?? '',
        position: player.position,
        rating: null,
      };
    }),
  };
}

async function buildStoredLineups(tx, lineups, homeTeamId, awayTeamId) {
  const playerIds = [...lineups.home.starters, ...lineups.home.bench, ...lineups.away.starters, ...lineups.away.bench];
  const players = await tx.player.findMany({ where: { id: { in: [...new Set(playerIds)] } } });
  const playerMap = new Map(players.map((player) => [player.id, player]));
  if (playerMap.size !== new Set(playerIds).size) {
    throw badRequest('One or more selected players no longer exist');
  }
  for (const [side, teamId] of [['home', homeTeamId], ['away', awayTeamId]]) {
    const ids = [...lineups[side].starters, ...lineups[side].bench];
    if (ids.some((playerId) => playerMap.get(playerId)?.teamId !== teamId)) {
      throw badRequest(`Every ${side} lineup player must belong to that team`);
    }
  }
  return {
    home: formatLineupSide(lineups.home, playerMap),
    away: formatLineupSide(lineups.away, playerMap),
  };
}

export async function updateMatchLineups(id, { version, lineups }, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id }, include: matchInclude });
    if (!match) throw notFound('Match not found');
    if (Number(version) !== match.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(match, { includeEvents: true }),
      });
    }
    if (match.status !== 'scheduled') {
      throw badRequest('Lineups can only be set for an upcoming match');
    }

    const storedLineups = await buildStoredLineups(tx, lineups, match.homeTeamId, match.awayTeamId);
    const changed = await tx.match.updateMany({
      where: { id, version: match.version },
      data: { lineups: storedLineups, version: match.version + 1 },
    });
    if (!changed.count) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT');
    }

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update_lineups',
      module: 'Matches',
      recordType: 'match',
      recordId: id,
      description: `Updated lineups for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      ipAddress,
    });
    return { matchId: id };
  }, { maxWait: 10_000, timeout: 15_000 });

  const full = await emitMatchUpdate(result.matchId);
  return serializeMatch(full, { includeEvents: true });
}

export async function updateManagerMatchLineup(id, { version, lineup }, teamId, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id }, include: matchInclude });
    if (!match) throw notFound('Match not found');
    if (Number(version) !== match.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(match, { includeEvents: true }),
      });
    }
    if (match.status !== 'scheduled') throw badRequest('Lineups can only be set for an upcoming match');
    const side = match.homeTeamId === teamId ? 'home' : match.awayTeamId === teamId ? 'away' : null;
    if (!side) throw badRequest('You can only set the lineup for your assigned team');

    const playerIds = [...lineup.starters, ...lineup.bench];
    const players = await tx.player.findMany({ where: { id: { in: [...new Set(playerIds)] } } });
    const playerMap = new Map(players.map((player) => [player.id, player]));
    if (playerMap.size !== new Set(playerIds).size) throw badRequest('One or more selected players no longer exist');
    if (playerIds.some((playerId) => playerMap.get(playerId)?.teamId !== teamId)) {
      throw badRequest('Every lineup player must belong to your assigned team');
    }

    const currentLineups = match.lineups && typeof match.lineups === 'object' ? match.lineups : {};
    const storedLineups = { ...currentLineups, [side]: formatLineupSide(lineup, playerMap) };
    const changed = await tx.match.updateMany({
      where: { id, version: match.version },
      data: { lineups: storedLineups, version: match.version + 1 },
    });
    if (!changed.count) throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT');
    await logActivity(tx, {
      userId: actor?.id,
      action: 'update_lineup',
      module: 'Matches',
      recordType: 'match',
      recordId: id,
      description: `Updated ${side} lineup for ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      ipAddress,
    });
    return { matchId: id };
  }, { maxWait: 10_000, timeout: 15_000 });

  const full = await emitMatchUpdate(result.matchId);
  return serializeMatch(full, { includeEvents: true });
}

export async function updateMatchStatus(id, { status, minute, version }, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.match.findUnique({ where: { id }, include: matchInclude });
    if (!current) throw notFound('Match not found');
    if (version === undefined || Number(version) !== current.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(current, { includeEvents: true }),
      });
    }

    let nextMinute = minute;
    if (nextMinute === undefined) {
      if (status === 'live' && current.status === 'ht') nextMinute = 46;
      else if (status === 'live') nextMinute = current.minute || 1;
      else nextMinute = defaultMinute(status);
    }

    const changed = await tx.match.updateMany({
      where: { id, version: current.version },
      data: {
        status,
        minute: nextMinute,
        version: current.version + 1,
      },
    });
    if (changed.count === 0) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(await tx.match.findUnique({ where: { id }, include: matchDetailInclude }), { includeEvents: true }),
      });
    }

    if (status === 'ft' || current.status === 'ft') {
      await recalculateStandings(tx, current.seasonId);
    }

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update_status',
      module: 'Matches',
      recordType: 'match',
      recordId: id,
      description: `Changed match status from ${current.status} to ${status}`,
      ipAddress,
    });

    return { matchId: id };
  }, { maxWait: 10_000, timeout: 15_000 });

  const full = await emitMatchUpdate(result.matchId);
  return serializeMatch(full, { includeEvents: true });
}

export async function deleteMatch(id, version, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.match.findUnique({ where: { id }, include: matchInclude });
    if (!current) throw notFound('Match not found');
    if (version === undefined || Number(version) !== current.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(current, { includeEvents: true }),
      });
    }

    const deleted = await tx.match.deleteMany({ where: { id, version: current.version } });
    if (deleted.count === 0) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(await tx.match.findUnique({ where: { id }, include: matchDetailInclude }), { includeEvents: true }),
      });
    }
    await recalculateStandings(tx, current.seasonId);

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Matches',
      recordType: 'match',
      recordId: id,
      description: `Deleted match ${id}`,
      ipAddress,
    });

    return {
      competitionId: current.competitionId,
      seasonId: current.seasonId,
    };
  });

  broadcast('match:removed', {
    matchId: id,
    competitionId: result.competitionId,
    seasonId: result.seasonId,
  });
  broadcast('standings:update', {
    competitionId: result.competitionId,
    seasonId: result.seasonId,
  });

  return { success: true };
}

export async function addMatchEvent(matchId, data, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: matchInclude });
    if (!match) throw notFound('Match not found');
    if (data.version === undefined || Number(data.version) !== match.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(match, { includeEvents: true }),
      });
    }

    if (!['live', 'ht', 'ft'].includes(match.status)) {
      throw badRequest('Events can only be recorded while a match is live, at half-time, or full-time');
    }

    if (![match.homeTeamId, match.awayTeamId].includes(data.teamId)) {
      throw badRequest('The event team must be one of the two teams in this match');
    }

    let player = null;
    if (data.playerId) {
      player = await tx.player.findUnique({ where: { id: data.playerId } });
      if (!player) throw badRequest('Player not found');
      if (player.teamId && player.teamId !== data.teamId) {
        throw badRequest('The player does not belong to the selected team');
      }
    }
    if (['goal', 'penalty'].includes(data.type) && !player) {
      throw badRequest('Select a registered player so the goal can be added to the scorer table');
    }

    if (data.relatedPlayerId) {
      const related = await tx.player.findUnique({ where: { id: data.relatedPlayerId } });
      if (!related) throw badRequest('Related player not found');
    }

    const event = await tx.matchEvent.create({
      data: {
        matchId,
        teamId: data.teamId,
        playerId: data.playerId ?? null,
        relatedPlayerId: data.relatedPlayerId ?? null,
        type: data.type,
        minute: data.minute,
        note: data.note ?? null,
        x: data.x ?? null,
        y: data.y ?? null,
      },
    });

    const delta = scoreDelta(data.type, data.teamId, match);
    const homeScore = match.homeScore + delta.home;
    const awayScore = match.awayScore + delta.away;

    const changed = await tx.match.updateMany({
      where: { id: matchId, version: match.version },
      data: {
        homeScore,
        awayScore,
        version: match.version + 1,
      },
    });
    if (changed.count === 0) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(await tx.match.findUnique({ where: { id: matchId }, include: matchDetailInclude }), { includeEvents: true }),
      });
    }

    if (match.status === 'ft') {
      await recalculateStandings(tx, match.seasonId);
    }

    await logActivity(tx, {
      userId: actor?.id,
      action: 'add_event',
      module: 'Matches',
      recordType: 'match',
      recordId: matchId,
      description: `Added ${data.type} event at ${data.minute}' to match ${matchId}`,
      ipAddress,
    });

    return {
      eventId: event.id,
      matchId,
      competitionId: match.competitionId,
      seasonId: match.seasonId,
    };
  }, { maxWait: 10_000, timeout: 15_000 });

  const event = await prisma.matchEvent.findUnique({
    where: { id: result.eventId },
    include: { player: true, relatedPlayer: true, team: true },
  });

  const full = await emitMatchUpdate(result.matchId);
  broadcast('match:event', {
    matchId: result.matchId,
    event: {
      id: event.id,
      type: event.type,
      minute: event.minute,
      teamId: event.teamId,
      player: event.player?.name ?? null,
      note: event.note,
      x: event.x,
      y: event.y,
    },
  });

  return {
    event: {
      id: event.id,
      matchId: event.matchId,
      teamId: event.teamId,
      playerId: event.playerId,
      player: event.player?.name ?? null,
      relatedPlayerId: event.relatedPlayerId,
      relatedPlayer: event.relatedPlayer?.name ?? null,
      type: event.type,
      minute: event.minute,
      note: event.note,
      x: event.x,
      y: event.y,
    },
    match: serializeMatch(full, { includeEvents: true }),
  };
}

export async function deleteMatchEvent(matchId, eventId, version, actor, ipAddress = null) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: matchInclude });
    if (!match) throw notFound('Match not found');
    if (version === undefined || Number(version) !== match.version) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(match, { includeEvents: true }),
      });
    }

    const event = await tx.matchEvent.findFirst({ where: { id: eventId, matchId } });
    if (!event) throw notFound('Match event not found');

    await tx.matchEvent.delete({ where: { id: event.id } });

    const delta = scoreDelta(event.type, event.teamId, match);
    const homeScore = Math.max(0, match.homeScore - delta.home);
    const awayScore = Math.max(0, match.awayScore - delta.away);

    const changed = await tx.match.updateMany({
      where: { id: matchId, version: match.version },
      data: {
        homeScore,
        awayScore,
        version: match.version + 1,
      },
    });
    if (changed.count === 0) {
      throw conflict('This match was changed by someone else. Reload it and try again.', 'MATCH_VERSION_CONFLICT', {
        current: serializeMatch(await tx.match.findUnique({ where: { id: matchId }, include: matchDetailInclude }), { includeEvents: true }),
      });
    }

    if (match.status === 'ft') {
      await recalculateStandings(tx, match.seasonId);
    }

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete_event',
      module: 'Matches',
      recordType: 'match',
      recordId: matchId,
      description: `Removed ${event.type} event at ${event.minute}' from match ${matchId}`,
      ipAddress,
    });

    return {
      competitionId: match.competitionId,
      seasonId: match.seasonId,
    };
  }, { maxWait: 10_000, timeout: 15_000 });

  const full = await emitMatchUpdate(matchId);
  return { success: true, match: serializeMatch(full, { includeEvents: true }) };
}
