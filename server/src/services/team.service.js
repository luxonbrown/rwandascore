import { prisma } from '../config/prisma.js';
import { notFound } from '../utils/errors.js';
import { serializeMatch, serializePlayer, serializeTeam } from '../utils/serializers.js';
import { matchInclude } from './match.service.js';
import { getSeasonForCompetition } from './standings.service.js';

export async function listTeams({ page = 1, pageSize = 20, search = '', competitionId }) {
  let competition = null;
  let season = null;
  let teamIds = null;

  if (competitionId) {
    competition = await prisma.competition.findFirst({
      where: { OR: [{ id: competitionId }, { slug: competitionId }] },
    });
    if (!competition) throw notFound('Competition not found');

    if (competition.type === 'national') {
      const teams = await prisma.team.findMany({
        where: {
          isNational: true,
          ...(search ? { name: { contains: search } } : {}),
        },
        include: { stadium: true },
        orderBy: { name: 'asc' },
      });

      return {
        items: teams.map(serializeTeam),
        total: teams.length,
        page: 1,
        pageSize: teams.length,
        totalPages: 1,
      };
    }

    season = await getSeasonForCompetition(competition.id);
    if (season) {
      const matches = await prisma.match.findMany({
        where: { competitionId: competition.id, seasonId: season.id },
        select: { homeTeamId: true, awayTeamId: true },
      });
      teamIds = [...new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]))];
    } else {
      teamIds = [];
    }
  }

  const where = {
    ...(teamIds ? { id: { in: teamIds } } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };

  const [total, teams] = await Promise.all([
    prisma.team.count({ where }),
    prisma.team.findMany({
      where,
      include: { stadium: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const standings = season
    ? await prisma.standing.findMany({ where: { seasonId: season.id } })
    : [];
  const standingMap = new Map(standings.map((row) => [row.teamId, row]));

  return {
    items: teams.map((team) => {
      const row = standingMap.get(team.id);
      return {
        ...serializeTeam(team),
        position: row?.position ?? null,
        played: row?.played ?? 0,
        points: row?.points ?? 0,
        form: row?.form ? row.form.split('') : [],
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getTeamScorers(teamId, limit = 5) {
  const grouped = await prisma.matchEvent.groupBy({
    by: ['playerId'],
    where: {
      teamId,
      playerId: { not: null },
      type: { in: ['goal', 'penalty'] },
    },
    _count: { _all: true },
    orderBy: { _count: { playerId: 'desc' } },
    take: limit,
  });

  const players = await prisma.player.findMany({
    where: { id: { in: grouped.map((row) => row.playerId).filter(Boolean) } },
  });
  const playerMap = new Map(players.map((player) => [player.id, player]));

  return grouped
    .map((row) => {
      const player = playerMap.get(row.playerId);
      if (!player) return null;
      return {
        player: serializePlayer(player),
        goals: row._count._all,
      };
    })
    .filter(Boolean);
}

export async function getTeam(identifier) {
  const team = await prisma.team.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    include: { stadium: true },
  });

  if (!team) throw notFound('Team not found');

  const [squad, matches, standings, scorers] = await Promise.all([
    prisma.player.findMany({
      where: { teamId: team.id },
      orderBy: [{ position: 'asc' }, { number: 'asc' }, { name: 'asc' }],
    }),
    prisma.match.findMany({
      where: { OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }] },
      include: matchInclude,
      orderBy: { kickoffAt: 'desc' },
      take: 20,
    }),
    prisma.standing.findMany({
      where: { teamId: team.id },
      include: { season: true },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    }),
    getTeamScorers(team.id),
  ]);

  const finished = matches.filter((match) => match.status === 'ft');
  const upcoming = [...matches]
    .filter((match) => ['scheduled', 'live', 'ht', 'postponed'].includes(match.status))
    .sort((a, b) => new Date(a.kickoffAt) - new Date(b.kickoffAt));

  const form = finished
    .slice(0, 5)
    .map((match) => {
      const isHome = match.homeTeamId === team.id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;
      if (teamScore > opponentScore) return 'W';
      if (teamScore < opponentScore) return 'L';
      return 'D';
    });

  return {
    ...serializeTeam(team),
    squad: squad.map((player) => serializePlayer(player)),
    matches: matches.map((match) => serializeMatch(match)),
    upcoming: upcoming.map((match) => serializeMatch(match)),
    results: finished.map((match) => serializeMatch(match)),
    nextMatch: upcoming[0] ? serializeMatch(upcoming[0]) : null,
    lastMatch: finished[0] ? serializeMatch(finished[0]) : null,
    standing: standings[0]
      ? {
          seasonId: standings[0].seasonId,
          season: standings[0].season.name,
          position: standings[0].position,
          played: standings[0].played,
          won: standings[0].won,
          drawn: standings[0].drawn,
          lost: standings[0].lost,
          goalsFor: standings[0].goalsFor,
          goalsAgainst: standings[0].goalsAgainst,
          goalDifference: standings[0].goalsFor - standings[0].goalsAgainst,
          points: standings[0].points,
          form,
        }
      : null,
    form,
    topScorers: scorers,
  };
}

export async function getTeamMatches(identifier, query = {}) {
  const team = await prisma.team.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    select: { id: true, name: true },
  });
  if (!team) throw notFound('Team not found');

  const { listMatches } = await import('./match.service.js');
  const result = await listMatches({ ...query, teamId: team.id });
  return { team, ...result };
}
