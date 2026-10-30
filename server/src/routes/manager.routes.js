import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, requirePasswordChanged, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/errors.js';
import { listPlayers } from '../services/player.service.js';
import { listMatches } from '../services/match.service.js';
import { createPlayer, updatePlayer, deletePlayer } from '../services/admin.service.js';
import { logActivity } from '../services/activity.service.js';
import { managerMessageSchema, playerCreateSchema, playerUpdateSchema, teamUpdateSchema } from '../validators/index.js';
import { serializeActivity, serializeTeam } from '../utils/serializers.js';

export const managerRouter = Router();
managerRouter.use(requireAuth, requirePasswordChanged, requireRole('TEAM_MANAGER'));

async function assignedTeam(userId) {
  const team = await prisma.team.findFirst({ where: { managerUserId: userId }, include: { stadium: true } });
  if (!team) throw notFound('No team is assigned to this manager');
  return team;
}

managerRouter.get('/team', asyncHandler(async (req, res) => {
  const team = await prisma.team.findFirst({ where: { managerUserId: req.user.id }, include: { stadium: true } });
  res.json(serializeTeam(team));
}));
managerRouter.post('/messages', validate({ body: managerMessageSchema }), asyncHandler(async (req, res) => {
  const team = await prisma.team.findFirst({ where: { managerUserId: req.user.id }, select: { id: true, name: true } });
  const message = req.body.message.trim();
  await prisma.$transaction((tx) => logActivity(tx, {
    userId: req.user.id,
    action: 'message_to_admin',
    module: 'Team manager messages',
    recordType: 'manager_message',
    recordId: team?.id ?? null,
    description: `${team?.name ? `[${team.name}] ` : '[No team assigned] '}${message}`,
    ipAddress: req.ip,
  }));
  res.status(201).json({ success: true });
}));
managerRouter.get('/messages', asyncHandler(async (req, res) => {
  const messages = await prisma.activityLog.findMany({
    where: { userId: req.user.id, module: 'Team manager messages', action: 'message_to_admin' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { id: true, name: true, role: true } } },
  });
  const replies = messages.length ? await prisma.activityLog.findMany({
    where: { module: 'Team manager messages', action: 'admin_reply', recordId: { in: messages.map(({ id }) => id) } },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, role: true } } },
  }) : [];
  res.json(messages.map((message) => ({
    ...serializeActivity(message),
    body: message.description.replace(/^\[[^\]]+\]\s*/, ''),
    replies: replies.filter((reply) => reply.recordId === message.id).map(serializeActivity),
  })));
}));
managerRouter.put('/team', validate({ body: teamUpdateSchema }), asyncHandler(async (req, res) => {
  const team = await assignedTeam(req.user.id);
  const allowed = ['name', 'shortName', 'initials', 'city', 'stadiumId', 'founded', 'nickname', 'coach', 'primaryColor', 'secondaryColor', 'logoUrl', 'description'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.team.update({ where: { id: team.id }, data, include: { stadium: true } });
    await logActivity(tx, { userId: req.user.id, action: 'update', module: 'Team registration', recordType: 'team', recordId: team.id, description: `Updated registration details for ${team.name}`, ipAddress: req.ip });
    return result;
  });
  res.json(serializeTeam(updated));
}));
managerRouter.get('/players', asyncHandler(async (req, res) => {
  const team = await prisma.team.findFirst({ where: { managerUserId: req.user.id }, select: { id: true } });
  if (!team) return res.json({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  return res.json(await listPlayers({ page: 1, pageSize: 100, teamId: team.id }));
}));
// Managers can see fixtures and results involving their own club, but receive no
// match mutation routes. The assigned team filter always overrides query input.
managerRouter.get('/matches', asyncHandler(async (req, res) => {
  const team = await prisma.team.findFirst({ where: { managerUserId: req.user.id }, select: { id: true } });
  if (!team) return res.json({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  return res.json(await listMatches({ page: 1, pageSize: 100, sort: 'kickoffAt', order: 'desc', teamId: team.id }));
}));
managerRouter.post('/players', validate({ body: playerCreateSchema }), asyncHandler(async (req, res) => {
  const team = await assignedTeam(req.user.id);
  res.status(201).json(await createPlayer({ ...req.body, teamId: team.id }, req.user, req.ip));
}));
managerRouter.put('/players/:id', validate({ body: playerUpdateSchema }), asyncHandler(async (req, res) => {
  const team = await assignedTeam(req.user.id);
  const player = await prisma.player.findFirst({ where: { id: req.params.id, teamId: team.id } });
  if (!player) throw notFound('Player not found in your team');
  res.json(await updatePlayer(player.id, { ...req.body, teamId: team.id }, req.user, req.ip));
}));
managerRouter.delete('/players/:id', asyncHandler(async (req, res) => {
  const team = await assignedTeam(req.user.id);
  const player = await prisma.player.findFirst({ where: { id: req.params.id, teamId: team.id } });
  if (!player) throw notFound('Player not found in your team');
  res.json(await deletePlayer(player.id, req.user, req.ip));
}));
