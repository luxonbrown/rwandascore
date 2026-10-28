import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  matchListQuery, playerListQuery, searchQuery, standingsQuery, teamListQuery,
  newsListQuery,
} from '../validators/index.js';
import { listMatches, getLiveMatches, getMatch } from '../services/match.service.js';
import { listCompetitions, getCompetition, getCompetitionOverview, getCompetitionStandings, getTopScorers } from '../services/competition.service.js';
import { listTeams, getTeam } from '../services/team.service.js';
import { listPlayers, getPlayer } from '../services/player.service.js';
import { listNews, getNewsBySlug } from '../services/news.service.js';
import { search } from '../services/search.service.js';
import { getPublicSettings } from '../services/settings.service.js';

export const publicRouter = Router();
const send = (handler) => asyncHandler(async (req, res) => res.json(await handler(req)));
const statusFilter = (value) => ({ UPCOMING: 'scheduled', LIVE: 'live', HT: 'ht', FT: 'ft', POSTPONED: 'postponed' }[value] || value);

publicRouter.get('/settings', send(() => getPublicSettings()));
publicRouter.get('/matches/live', send(() => getLiveMatches()));
publicRouter.get('/matches', validate({ query: matchListQuery }), send(async ({ query }) => {
  const competitionId = query.competitionId || (query.competition
    ? (await prisma.competition.findFirst({ where: { OR: [{ id: query.competition }, { slug: query.competition }] } }))?.id
    : undefined);
  const teamId = query.teamId || (query.team
    ? (await prisma.team.findFirst({ where: { OR: [{ id: query.team }, { slug: query.team }] } }))?.id
    : undefined);
  return listMatches({ ...query, status: statusFilter(query.status), competitionId, teamId });
}));
publicRouter.get('/fixtures', validate({ query: matchListQuery }), send(({ query }) =>
  listMatches({ ...query, status: statusFilter(query.status) || 'scheduled' }))); 
publicRouter.get('/results', validate({ query: matchListQuery }), send(({ query }) =>
  listMatches({ ...query, status: statusFilter(query.status) || 'ft' })));
publicRouter.get('/matches/:id', send(({ params }) => getMatch(params.id)));

publicRouter.get('/competitions', send(() => listCompetitions()));
publicRouter.get('/competitions/:slug/standings', validate({ query: standingsQuery }), send(({ params, query }) => getCompetitionStandings(params.slug, query.seasonId)));
publicRouter.get('/competitions/:slug/top-scorers', send(async ({ params, query }) => {
  const competition = await prisma.competition.findFirst({ where: { OR: [{ id: params.slug }, { slug: params.slug }] } });
  if (!competition) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const items = await getTopScorers(competition.id, query.seasonId, limit);
  return { items, total: items.length, page: 1, pageSize: limit, totalPages: 1 };
}));
publicRouter.get('/competitions/:slug/fixtures', validate({ query: matchListQuery }), send(async ({ params, query }) => {
  const competition = await prisma.competition.findFirst({ where: { OR: [{ id: params.slug }, { slug: params.slug }] } });
  if (!competition) return { items: [], total: 0, page: query.page, pageSize: query.pageSize, totalPages: 0 };
  return listMatches({ ...query, competitionId: competition.id, status: 'scheduled' });
}));
publicRouter.get('/competitions/:slug/results', validate({ query: matchListQuery }), send(async ({ params, query }) => {
  const competition = await prisma.competition.findFirst({ where: { OR: [{ id: params.slug }, { slug: params.slug }] } });
  if (!competition) return { items: [], total: 0, page: query.page, pageSize: query.pageSize, totalPages: 0 };
  return listMatches({ ...query, competitionId: competition.id, status: 'ft' });
}));
publicRouter.get('/competitions/:slug', send(({ params }) => getCompetitionOverview(params.slug)));

publicRouter.get('/teams', validate({ query: teamListQuery }), send(({ query }) => listTeams(query)));
publicRouter.get('/teams/:id', send(({ params }) => getTeam(params.id)));
publicRouter.get('/players', validate({ query: playerListQuery }), send(({ query }) => listPlayers(query)));
publicRouter.get('/players/:id', send(({ params }) => getPlayer(params.id)));
publicRouter.get('/news', validate({ query: newsListQuery }), send(({ query }) => listNews({ ...query, publicOnly: true })));
publicRouter.get('/news/:slug', send(({ params }) => getNewsBySlug(params.slug)));
publicRouter.get('/search', validate({ query: searchQuery }), send(({ query }) => search(query.q)));
