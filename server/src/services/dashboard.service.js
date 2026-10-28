import { prisma } from '../config/prisma.js';
import { serializeActivity, serializeMatch, serializeNews } from '../utils/serializers.js';
import { matchInclude } from './match.service.js';
import { getTopScorers } from './competition.service.js';
import { getSeasonForCompetition } from './standings.service.js';

export async function getDashboardStats() {
  const [
    teams,
    players,
    competitions,
    matches,
    liveMatches,
    upcoming,
    recentResults,
    publishedNews,
    users,
    recentActivity,
  ] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.competition.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: { in: ['live', 'ht'] } } }),
    prisma.match.findMany({
      where: { status: 'scheduled' },
      include: matchInclude,
      orderBy: { kickoffAt: 'asc' },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: 'ft' },
      include: matchInclude,
      orderBy: { kickoffAt: 'desc' },
      take: 5,
    }),
    prisma.news.count({ where: { status: 'published' } }),
    prisma.user.count(),
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const league = await prisma.competition.findFirst({
    where: { type: 'league' },
    orderBy: { createdAt: 'asc' },
  });
  const season = league ? await getSeasonForCompetition(league.id) : null;
  const topScorers = league && season ? await getTopScorers(league.id, season.id, 5) : [];

  return {
    counts: {
      teams,
      players,
      competitions,
      matches,
      liveMatches,
      publishedNews,
      users,
    },
    upcoming: upcoming.map((match) => serializeMatch(match)),
    recentResults: recentResults.map((match) => serializeMatch(match)),
    topScorers,
    recentActivity: recentActivity.map(serializeActivity),
  };
}
