import { prisma } from '../config/prisma.js';
import { notFound } from '../utils/errors.js';
import {
  serializeCompetition,
  serializeMatch,
  serializePlayer,
  serializeScorer,
  serializeSeason,
  serializeStanding,
  serializeTeam,
} from '../utils/serializers.js';
import {
  getSeasonForCompetition,
  getStandingsRows,
} from './standings.service.js';
import { matchInclude } from './match.service.js';

export async function findCompetition(identifier) {
  return prisma.competition.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
  });
}

export async function listCompetitions() {
  const competitions = await prisma.competition.findMany({
    orderBy: { name: 'asc' },
    include: {
      seasons: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  return {
    items: competitions.map((competition) => ({
      ...serializeCompetition(competition),
      currentSeason: competition.seasons[0] ? serializeSeason(competition.seasons[0]) : null,
    })),
    total: competitions.length,
    page: 1,
    pageSize: competitions.length,
    totalPages: 1,
  };
}

export async function getCompetition(identifier) {
  const competition = await findCompetition(identifier);
  if (!competition) throw notFound('Competition not found');

  const seasons = await prisma.season.findMany({
    where: { competitionId: competition.id },
    orderBy: { startDate: 'desc' },
  });

  return {
    ...serializeCompetition(competition),
    seasons: seasons.map(serializeSeason),
  };
}

export async function getTopScorers(competitionId, seasonId, limit = 20) {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw notFound('Competition not found');

  const season = seasonId
    ? await prisma.season.findUnique({ where: { id: seasonId } })
    : await getSeasonForCompetition(competitionId);

  if (!season) return [];

  const grouped = await prisma.matchEvent.groupBy({
    by: ['playerId'],
    where: {
      playerId: { not: null },
      type: { in: ['goal', 'penalty'] },
      match: {
        competitionId,
        seasonId: season.id,
      },
      ...(competition.type === 'national' ? { player: { isNationalTeam: true } } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { playerId: 'desc' } },
    take: limit,
  });

  const playerIds = grouped.map((row) => row.playerId).filter(Boolean);
  if (!playerIds.length) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    include: { team: { include: { stadium: true } } },
  });

  const playerMap = new Map(players.map((player) => [player.id, player]));

  return grouped
    .map((row, index) => {
      const player = playerMap.get(row.playerId);
      if (!player) return null;

      return serializeScorer({
        rank: index + 1,
        player: serializePlayer(player),
        team: player.team ? serializeTeam(player.team) : null,
        goals: row._count._all,
        assists: 0,
        appearances: 0,
      });
    })
    .filter(Boolean)
    .sort((a, b) => b.goals - a.goals || a.player.name.localeCompare(b.player.name))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getBracket(competitionId, seasonId) {
  const matches = await prisma.match.findMany({
    where: { competitionId, ...(seasonId ? { seasonId } : {}) },
    include: matchInclude,
    orderBy: [{ round: 'asc' }, { kickoffAt: 'asc' }],
  });

  const groups = new Map();
  for (const match of matches) {
    const round = match.round || 'TBD';
    if (!groups.has(round)) groups.set(round, []);
    groups.get(round).push(serializeMatch(match));
  }

  return [...groups.entries()].map(([round, roundMatches]) => ({
    round,
    matches: roundMatches,
  }));
}

export async function getNationalSquad() {
  const players = await prisma.player.findMany({
    where: { isNationalTeam: true },
    include: { team: { include: { stadium: true } } },
    orderBy: [{ position: 'asc' }, { number: 'asc' }, { name: 'asc' }],
  });

  return players.map((player) => serializePlayer(player));
}

export async function getCompetitionTeams(identifier) {
  const competition = await findCompetition(identifier);
  if (!competition) throw notFound('Competition not found');

  const season = await getSeasonForCompetition(competition.id);
  let teams = [];

  if (competition.type === 'national') {
    teams = await prisma.team.findMany({
      where: { isNational: true },
      include: { stadium: true },
      orderBy: { name: 'asc' },
    });
  } else if (season) {
    const matches = await prisma.match.findMany({
      where: { competitionId: competition.id, seasonId: season.id },
      select: { homeTeamId: true, awayTeamId: true },
    });
    const teamIds = [...new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]))];

    teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: { stadium: true },
      orderBy: { name: 'asc' },
    });
  }

  const standings = season
    ? await prisma.standing.findMany({
        where: { seasonId: season.id },
        orderBy: { position: 'asc' },
      })
    : [];
  const standingMap = new Map(standings.map((row) => [row.teamId, row]));

  return teams.map((team) => {
    const row = standingMap.get(team.id);
    return {
      ...serializeTeam(team),
      position: row?.position ?? null,
      played: row?.played ?? 0,
      points: row?.points ?? 0,
      form: row?.form ? row.form.split('') : [],
    };
  });
}

export async function getCompetitionOverview(identifier) {
  const competition = await findCompetition(identifier);
  if (!competition) throw notFound('Competition not found');

  const season = await getSeasonForCompetition(competition.id);
  const matchWhere = {
    competitionId: competition.id,
    ...(season ? { seasonId: season.id } : {}),
  };

  const [matches, standingsResult, topScorers, bracket, nationalSquad, teams] = await Promise.all([
    prisma.match.findMany({
      where: matchWhere,
      include: matchInclude,
      orderBy: { kickoffAt: 'asc' },
    }),
    season
      ? prisma.standing.findMany({
          where: { seasonId: season.id },
          include: { team: { include: { stadium: true } } },
          orderBy: { position: 'asc' },
        })
      : [],
    getTopScorers(competition.id, season?.id),
    competition.type === 'cup' ? getBracket(competition.id, season?.id) : [],
    competition.type === 'national' ? getNationalSquad() : [],
    getCompetitionTeams(competition.id),
  ]);

  return {
    competition: serializeCompetition(competition),
    season: season ? serializeSeason(season) : null,
    matches: matches.map((match) => serializeMatch(match)),
    standings: standingsResult.map((row) => serializeStanding(row, standingsResult.length)),
    topScorers,
    bracket,
    nationalSquad,
    teams,
  };
}

export async function getCompetitionStandings(identifier, seasonId = undefined) {
  const competition = await findCompetition(identifier);
  if (!competition) throw notFound('Competition not found');

  const { season, rows } = await getStandingsRows(competition.id, seasonId);

  return {
    competition: serializeCompetition(competition),
    season: season ? serializeSeason(season) : null,
    standings: rows.map((row) => serializeStanding(row, rows.length)),
  };
}
