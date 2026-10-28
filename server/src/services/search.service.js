import { prisma } from '../config/prisma.js';
import { serializeMatch, serializeNews, serializePlayer, serializeTeam } from '../utils/serializers.js';
import { matchInclude } from './match.service.js';

export async function search(query) {
  const term = String(query ?? '').trim();
  if (term.length < 2) {
    return {
      query: term,
      total: 0,
      competitions: [],
      teams: [],
      players: [],
      matches: [],
      news: [],
    };
  }

  const [competitions, teams, players, matches, news] = await Promise.all([
    prisma.competition.findMany({
      where: {
        OR: [
          { name: { contains: term } },
          { shortName: { contains: term } },
        ],
      },
      take: 3,
    }),
    prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: term } },
          { shortName: { contains: term } },
          { city: { contains: term } },
        ],
      },
      include: { stadium: true },
      take: 5,
    }),
    prisma.player.findMany({
      where: { name: { contains: term } },
      include: { team: { include: { stadium: true } } },
      take: 5,
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { name: { contains: term } } },
          { awayTeam: { name: { contains: term } } },
          { venue: { contains: term } },
        ],
      },
      include: matchInclude,
      orderBy: { kickoffAt: 'desc' },
      take: 5,
    }),
    prisma.news.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } },
        ],
      },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
  ]);

  const result = {
    query: term,
    competitions: competitions.map((competition) => ({
      id: competition.id,
      name: competition.name,
      shortName: competition.shortName,
      slug: competition.slug,
      type: competition.type,
    })),
    teams: teams.map(serializeTeam),
    players: players.map((player) => serializePlayer(player)),
    matches: matches.map((match) => serializeMatch(match)),
    news: news.map((article) => serializeNews(article)),
  };

  return {
    ...result,
    total:
      result.competitions.length +
      result.teams.length +
      result.players.length +
      result.matches.length +
      result.news.length,
  };
}
