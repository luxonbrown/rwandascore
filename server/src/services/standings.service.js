import { prisma } from '../config/prisma.js';
import { notFound } from '../utils/errors.js';

export async function recalculateStandings(tx, seasonId) {
  await tx.$queryRaw`SELECT id FROM seasons WHERE id = ${seasonId} FOR UPDATE`;

  const matches = await tx.match.findMany({
    where: { seasonId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
    orderBy: { kickoffAt: 'asc' },
  });

  const table = new Map();

  const ensureTeam = (team) => {
    if (!table.has(team.id)) {
      table.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        form: [],
      });
    }
    return table.get(team.id);
  };

  for (const match of matches) {
    ensureTeam(match.homeTeam);
    ensureTeam(match.awayTeam);
  }

  for (const match of matches) {
    if (match.status !== 'ft') continue;

    const home = ensureTeam(match.homeTeam);
    const away = ensureTeam(match.awayTeam);

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
      home.form.push('W');
      away.form.push('L');
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
      away.form.push('W');
      home.form.push('L');
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push('D');
      away.form.push('D');
    }
  }

  const rows = [...table.values()]
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      form: row.form.slice(-5),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });

  await tx.standing.deleteMany({ where: { seasonId } });

  if (rows.length) {
    await tx.standing.createMany({
      data: rows.map((row, index) => ({
        seasonId,
        teamId: row.teamId,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
        position: index + 1,
        form: row.form.join(''),
      })),
    });
  }

  return rows;
}

export async function findCompetition(identifier) {
  return prisma.competition.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
  });
}

export async function getSeasonForCompetition(competitionId, seasonId = undefined) {
  if (seasonId) {
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season || season.competitionId !== competitionId) {
      throw notFound('Season not found for this competition');
    }
    return season;
  }

  return (
    (await prisma.season.findFirst({
      where: { competitionId, isCurrent: true },
      orderBy: { createdAt: 'desc' },
    })) ??
    (await prisma.season.findFirst({
      where: { competitionId },
      orderBy: { createdAt: 'desc' },
    }))
  );
}

export async function getStandingsRows(competitionId, seasonId = undefined) {
  const season = await getSeasonForCompetition(competitionId, seasonId);
  if (!season) return { season: null, rows: [] };

  const rows = await prisma.standing.findMany({
    where: { seasonId: season.id },
    include: { team: { include: { stadium: true } } },
    orderBy: { position: 'asc' },
  });

  return { season, rows };
}
