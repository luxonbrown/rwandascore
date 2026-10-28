import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, requirePasswordChanged, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/errors.js';
import { listPlayers } from '../services/player.service.js';
import { createPlayer, updatePlayer, deletePlayer } from '../services/admin.service.js';
import { logActivity } from '../services/activity.service.js';
import { playerCreateSchema, playerUpdateSchema, teamUpdateSchema } from '../validators/index.js';
import { serializeTeam } from '../utils/serializers.js';

export const managerRouter = Router();
managerRouter.use(requireAuth, requirePasswordChanged, requireRole('TEAM_MANAGER'));

async function assignedTeam(userId) {
  const team = await prisma.team.findFirst({ where: { managerUserId: userId }, include: { stadium: true } });
  if (!team) throw notFound('No team is assigned to this manager');
  return team;
}

managerRouter.get('/team', asyncHandler(async (req, res) => res.json(serializeTeam(await assignedTeam(req.user.id)))));
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
  const team = await assignedTeam(req.user.id);
  res.json(await listPlayers({ page: 1, pageSize: 100, teamId: team.id }));
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
