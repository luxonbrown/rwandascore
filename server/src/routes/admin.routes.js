import fs from 'node:fs/promises';
import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, requirePasswordChanged, requireRole } from '../middleware/auth.js';
import { uploadImage, uploadedFileUrl, uploadDir, isSafeUploadFilename } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/errors.js';
import { logActivity } from '../services/activity.service.js';
import { getDashboardStats } from '../services/dashboard.service.js';
import { listUsers, getUser, createUser, updateUser, deleteUser, resetUserPassword } from '../services/user.service.js';
import { getSettingsMap, updateSettings } from '../services/settings.service.js';
import { listActivityLogs } from '../services/admin.service.js';
import { listCompetitions, getCompetition } from '../services/competition.service.js';
import { listTeams } from '../services/team.service.js';
import { listPlayers } from '../services/player.service.js';
import { listNews, getNewsById, createNews, updateNews, deleteNews, setNewsPublished } from '../services/news.service.js';
import { createMatch, listMatches, updateMatch, deleteMatch, addMatchEvent, deleteMatchEvent, updateMatchStatus } from '../services/match.service.js';
import { serializeCompetition, serializeSeason, serializeStadium, serializeTeam, serializePlayer } from '../utils/serializers.js';
import {
  activityListQuery, competitionCreateSchema, competitionUpdateSchema, eventCreateSchema,
  idParam, liveActionSchema, matchCreateSchema, matchListQuery, matchStatusSchema, matchUpdateSchema, matchVersionSchema, newsCreateSchema,
  newsListQuery, newsPublishSchema, newsUpdateSchema, paginationQuery, playerCreateSchema, playerListQuery,
  playerUpdateSchema, resetPasswordSchema, seasonCreateSchema, seasonListQuery,
  seasonUpdateSchema, settingsUpdateSchema, stadiumCreateSchema, stadiumUpdateSchema,
  teamCreateSchema, teamListQuery, teamUpdateSchema, userCreateSchema, userUpdateSchema,
} from '../validators/index.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requirePasswordChanged);
const adminOnly = requireRole('ADMIN');
const contentEditors = requireRole('ADMIN', 'EDITOR');
const ip = (value) => value?.ip || value?.ipAddress || value?.socket?.remoteAddress || null;
const send = (handler, status = 200) => asyncHandler(async (req, res) => res.status(status).json(await handler({ ...req, user: req.user ? { ...req.user, ip: ip(req) } : undefined })));
const currentUser = (req) => req.user;

adminRouter.get('/dashboard-stats', contentEditors, send(() => getDashboardStats()));

// User administration and operational settings are restricted to the single administrator role.
adminRouter.get('/users', adminOnly, send(({ query }) => listUsers({ page: Number(query.page) || 1, pageSize: Math.min(Number(query.pageSize) || 20, 100), search: query.search || '', role: query.role, isActive: query.isActive === undefined ? undefined : query.isActive === 'true' })));
adminRouter.post('/users', adminOnly, validate({ body: userCreateSchema }), send(({ body, user }) => createUser(body, user, ip(user)), 201));
adminRouter.get('/users/:id', adminOnly, validate({ params: idParam }), send(({ params }) => getUser(params.id)));
adminRouter.put('/users/:id', adminOnly, validate({ params: idParam, body: userUpdateSchema }), send(({ params, body, user }) => updateUser(params.id, body, user, ip(user))));
adminRouter.delete('/users/:id', adminOnly, validate({ params: idParam }), send(({ params, user }) => deleteUser(params.id, user, ip(user))));
adminRouter.post('/users/:id/reset-password', adminOnly, validate({ params: idParam, body: resetPasswordSchema }), send(({ params, body, user }) => resetUserPassword(params.id, body, user, ip(user))));
adminRouter.get('/activity-logs', contentEditors, validate({ query: activityListQuery }), send(({ query }) => listActivityLogs(query)));
adminRouter.get('/settings', adminOnly, send(() => getSettingsMap({ fresh: true })));
adminRouter.put('/settings', adminOnly, validate({ body: settingsUpdateSchema }), send(({ body, user }) => updateSettings(body.settings, user, ip(user))));

adminRouter.post('/uploads', contentEditors, uploadImage.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('Choose an image to upload');
  const url = uploadedFileUrl(req.file.filename);
  await prisma.$transaction((tx) => logActivity(tx, {
    userId: req.user.id,
    action: 'upload',
    module: 'Uploads',
    recordType: 'file',
    recordId: req.file.filename,
    description: `Uploaded ${req.file.originalname}`,
    ipAddress: ip(req),
  }));
  res.status(201).json({ filename: req.file.filename, url, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size });
}));
adminRouter.delete('/uploads/:filename', contentEditors, asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  if (!isSafeUploadFilename(filename)) throw badRequest('Invalid upload filename');
  const filePath = `${uploadDir}/${filename}`;
  try { await fs.unlink(filePath); } catch (error) { if (error.code === 'ENOENT') throw notFound('Upload not found'); throw error; }
  await prisma.$transaction((tx) => logActivity(tx, {
    userId: req.user.id,
    action: 'delete',
    module: 'Uploads',
    recordType: 'file',
    recordId: filename,
    description: `Deleted upload ${filename}`,
    ipAddress: ip(req),
  }));
  res.json({ success: true });
}));

// Editors can manage sports, match, and publishing content. Staff accounts and website settings remain admin-only.
adminRouter.get('/competitions', contentEditors, send(() => listCompetitions()));
adminRouter.post('/competitions', contentEditors, validate({ body: competitionCreateSchema }), send(({ body, user }) => import('../services/admin.service.js').then(({ createCompetition }) => createCompetition(body, user, ip(user))), 201));
adminRouter.get('/competitions/:id', contentEditors, validate({ params: idParam }), send(({ params }) => getCompetition(params.id)));
adminRouter.put('/competitions/:id', contentEditors, validate({ params: idParam, body: competitionUpdateSchema }), send(({ params, body, user }) => import('../services/admin.service.js').then(({ updateCompetition }) => updateCompetition(params.id, body, user, ip(user)))));
adminRouter.delete('/competitions/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => import('../services/admin.service.js').then(({ deleteCompetition }) => deleteCompetition(params.id, user, ip(user)))));

adminRouter.get('/seasons', contentEditors, validate({ query: seasonListQuery }), send(({ query }) => import('../services/admin.service.js').then(({ listSeasons }) => listSeasons(query))));
adminRouter.post('/seasons', contentEditors, validate({ body: seasonCreateSchema }), send(({ body, user }) => import('../services/admin.service.js').then(({ createSeason }) => createSeason(body, user, ip(user))), 201));
adminRouter.put('/seasons/:id', contentEditors, validate({ params: idParam, body: seasonUpdateSchema }), send(({ params, body, user }) => import('../services/admin.service.js').then(({ updateSeason }) => updateSeason(params.id, body, user, ip(user)))));
adminRouter.delete('/seasons/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => import('../services/admin.service.js').then(({ deleteSeason }) => deleteSeason(params.id, user, ip(user)))));

adminRouter.get('/stadiums', contentEditors, validate({ query: paginationQuery }), send(({ query }) => import('../services/admin.service.js').then(({ listStadiums }) => listStadiums(query))));
adminRouter.post('/stadiums', contentEditors, validate({ body: stadiumCreateSchema }), send(({ body, user }) => import('../services/admin.service.js').then(({ createStadium }) => createStadium(body, user, ip(user))), 201));
adminRouter.put('/stadiums/:id', contentEditors, validate({ params: idParam, body: stadiumUpdateSchema }), send(({ params, body, user }) => import('../services/admin.service.js').then(({ updateStadium }) => updateStadium(params.id, body, user, ip(user)))));
adminRouter.delete('/stadiums/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => import('../services/admin.service.js').then(({ deleteStadium }) => deleteStadium(params.id, user, ip(user)))));

adminRouter.get('/teams', contentEditors, validate({ query: teamListQuery }), send(({ query }) => listTeams(query)));
adminRouter.post('/teams', contentEditors, validate({ body: teamCreateSchema }), send(({ body, user }) => import('../services/admin.service.js').then(({ createTeam }) => createTeam(body, user, ip(user))), 201));
adminRouter.put('/teams/:id', contentEditors, validate({ params: idParam, body: teamUpdateSchema }), send(({ params, body, user }) => import('../services/admin.service.js').then(({ updateTeam }) => updateTeam(params.id, body, user, ip(user)))));
adminRouter.delete('/teams/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => import('../services/admin.service.js').then(({ deleteTeam }) => deleteTeam(params.id, user, ip(user)))));

adminRouter.get('/players', contentEditors, validate({ query: playerListQuery }), send(({ query }) => listPlayers(query)));
adminRouter.post('/players', contentEditors, validate({ body: playerCreateSchema }), send(({ body, user }) => import('../services/admin.service.js').then(({ createPlayer }) => createPlayer(body, user, ip(user))), 201));
adminRouter.put('/players/:id', contentEditors, validate({ params: idParam, body: playerUpdateSchema }), send(({ params, body, user }) => import('../services/admin.service.js').then(({ updatePlayer }) => updatePlayer(params.id, body, user, ip(user)))));
adminRouter.delete('/players/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => import('../services/admin.service.js').then(({ deletePlayer }) => deletePlayer(params.id, user, ip(user)))));

adminRouter.get('/matches', contentEditors, validate({ query: matchListQuery }), send(({ query }) => listMatches(query)));
adminRouter.post('/matches', contentEditors, validate({ body: matchCreateSchema }), send(({ body, user }) => createMatch(body, user, ip(user)), 201));
adminRouter.put('/matches/:id', contentEditors, validate({ params: idParam, body: matchUpdateSchema }), send(({ params, body, user }) => updateMatch(params.id, body, user, ip(user))));
adminRouter.delete('/matches/:id', contentEditors, validate({ params: idParam, body: matchVersionSchema }), send(({ params, body, user }) => deleteMatch(params.id, body.version, user, ip(user))));
adminRouter.get('/matches/:id/events', contentEditors, validate({ params: idParam }), send(async ({ params }) => (await import('../services/match.service.js')).getMatch(params.id).then((match) => match.events || [])));
adminRouter.post('/matches/:id/events', contentEditors, validate({ params: idParam, body: eventCreateSchema }), send(({ params, body, user }) => addMatchEvent(params.id, body, user, ip(user)), 201));
adminRouter.delete('/matches/:id/events/:eventId', contentEditors, validate({ body: matchVersionSchema }), asyncHandler(async (req, res) => res.json(await deleteMatchEvent(req.params.id, req.params.eventId, req.body.version, req.user, ip(req)))));

const liveStatus = (status) => asyncHandler(async (req, res) => {
  const result = await updateMatchStatus(req.params.id, { ...req.body, status }, req.user, ip(req));
  res.json(result);
});
adminRouter.post('/matches/:id/live/start', contentEditors, validate({ params: idParam, body: matchStatusSchema }), liveStatus('live'));
adminRouter.post('/matches/:id/live/minute', contentEditors, validate({ params: idParam, body: matchStatusSchema }), asyncHandler(async (req, res) => res.json(await updateMatchStatus(req.params.id, { ...req.body, status: 'live' }, req.user, ip(req)))));
adminRouter.post('/matches/:id/live/goal', contentEditors, validate({ params: idParam, body: eventCreateSchema }), asyncHandler(async (req, res) => res.status(201).json(await addMatchEvent(req.params.id, { ...req.body, type: req.body.type || 'goal' }, req.user, ip(req)))));
adminRouter.post('/matches/:id/live/card', contentEditors, validate({ params: idParam, body: eventCreateSchema }), asyncHandler(async (req, res) => {
  if (!['yellow', 'red'].includes(req.body.type)) throw badRequest('Card type must be yellow or red');
  res.status(201).json(await addMatchEvent(req.params.id, req.body, req.user, ip(req)));
}));
adminRouter.post('/matches/:id/live/substitution', contentEditors, validate({ params: idParam, body: eventCreateSchema }), asyncHandler(async (req, res) => {
  if (!req.body.relatedPlayerId) throw badRequest('A substitute player is required');
  res.status(201).json(await addMatchEvent(req.params.id, { ...req.body, type: 'substitution' }, req.user, ip(req)));
}));
adminRouter.post('/matches/:id/live/halftime', contentEditors, validate({ params: idParam, body: liveActionSchema }), liveStatus('ht'));
adminRouter.post('/matches/:id/live/secondhalf', contentEditors, validate({ params: idParam, body: liveActionSchema }), liveStatus('live'));
adminRouter.post('/matches/:id/live/fulltime', contentEditors, validate({ params: idParam, body: liveActionSchema }), liveStatus('ft'));

adminRouter.get('/news', contentEditors, validate({ query: newsListQuery }), send(({ query }) => listNews({ ...query, publicOnly: false, includeContent: true })));
adminRouter.post('/news', contentEditors, validate({ body: newsCreateSchema }), send(({ body, user }) => createNews(body, user, ip(user)), 201));
adminRouter.get('/news/:id', contentEditors, validate({ params: idParam }), send(({ params }) => getNewsById(params.id)));
adminRouter.put('/news/:id', contentEditors, validate({ params: idParam, body: newsUpdateSchema }), send(({ params, body, user }) => updateNews(params.id, body, user, ip(user))));
adminRouter.patch('/news/:id/publish', contentEditors, validate({ params: idParam, body: newsPublishSchema }), send(({ params, body, user }) => setNewsPublished(params.id, body.published, user, ip(user))));
adminRouter.delete('/news/:id', contentEditors, validate({ params: idParam }), send(({ params, user }) => deleteNews(params.id, user, ip(user))));
