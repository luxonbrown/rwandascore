import { prisma } from '../config/prisma.js';
import { notFound } from '../utils/errors.js';
import { serializePlayer, serializeTeam } from '../utils/serializers.js';

async function goalCounts(playerIds) {
  if (!playerIds.length) return new Map();

  const grouped = await prisma.matchEvent.groupBy({
    by: ['playerId'],
    where: {
      playerId: { in: playerIds },
      type: { in: ['goal', 'penalty'] },
    },
    _count: { _all: true },
  });

  return new Map(grouped.map((row) => [row.playerId, row._count._all]));
}

function sortPlayers(players, sort) {
  const sorted = [...players];

  if (sort === 'age') {
    sorted.sort((a, b) => {
      const aTime = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  } else if (sort === 'goals') {
    sorted.sort((a, b) => b.stats.goals - a.stats.goals || a.name.localeCompare(b.name));
  } else if (sort === 'assists') {
    sorted.sort((a, b) => b.stats.assists - a.stats.assists || a.name.localeCompare(b.name));
  } else if (sort === 'appearances') {
    sorted.sort((a, b) => b.stats.appearances - a.stats.appearances || a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

export async function listPlayers({
  page = 1,
  pageSize = 20,
  teamId,
  nationalTeam,
  search,
  position,
  sort = 'name',
}) {
  const where = {
    ...(teamId ? { teamId } : {}),
    ...(nationalTeam !== undefined ? { isNationalTeam: nationalTeam } : {}),
    ...(position ? { position } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };

  const players = await prisma.player.findMany({
    where,
    include: { team: { include: { stadium: true } } },
  });

  const counts = await goalCounts(players.map((player) => player.id));
  const withStats = players.map((player) =>
    serializePlayer(player, {
      goals: counts.get(player.id) ?? player.goals ?? 0,
      assists: player.assists ?? 0,
      appearances: player.appearances ?? 0,
      yellow: player.yellowCards ?? 0,
      red: player.redCards ?? 0,
      yellowCards: player.yellowCards ?? 0,
      redCards: player.redCards ?? 0,
      minutes: player.minutes ?? 0,
      cleanSheets: player.cleanSheets ?? 0,
    }),
  );

  const sorted = sortPlayers(withStats, sort);
  const total = sorted.length;

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPlayer(identifier) {
  const player = await prisma.player.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    include: { team: { include: { stadium: true } } },
  });

  if (!player) throw notFound('Player not found');

  const [goals, teammates, events] = await Promise.all([
    prisma.matchEvent.count({
      where: {
        playerId: player.id,
        type: { in: ['goal', 'penalty'] },
      },
    }),
    prisma.player.findMany({
      where: player.isNationalTeam
        ? { isNationalTeam: true, id: { not: player.id } }
        : player.teamId
          ? { teamId: player.teamId, id: { not: player.id } }
          : { id: { not: player.id } },
      include: { team: { include: { stadium: true } } },
      orderBy: [{ position: 'asc' }, { number: 'asc' }],
      take: 8,
    }),
    prisma.matchEvent.findMany({
      where: { playerId: player.id },
      include: {
        match: { include: { homeTeam: true, awayTeam: true, competition: true } },
        team: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    ...serializePlayer(player, {
      goals: goals || player.goals || 0,
      assists: player.assists ?? 0,
      appearances: player.appearances ?? 0,
      yellow: player.yellowCards ?? 0,
      red: player.redCards ?? 0,
      yellowCards: player.yellowCards ?? 0,
      redCards: player.redCards ?? 0,
      minutes: player.minutes ?? 0,
      cleanSheets: player.cleanSheets ?? 0,
    }),
    team: player.team ? serializeTeam(player.team) : null,
    teammates: teammates.map((teammate) => serializePlayer(teammate)),
    recentEvents: events.map((event) => ({
      id: event.id,
      type: event.type,
      minute: event.minute,
      matchId: event.matchId,
      match: `${event.match.homeTeam.name} ${event.match.homeScore}-${event.match.awayScore} ${event.match.awayTeam.name}`,
      competition: event.match.competition.name,
      date: event.match.kickoffAt,
    })),
  };
}
