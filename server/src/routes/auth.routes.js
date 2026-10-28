import { Router } from 'express';
import { login, refresh, logout, changePassword } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, refreshSchema, changePasswordSchema } from '../validators/index.js';

export const authRouter = Router();
const ip = (req) => req.ip || req.socket.remoteAddress || null;

authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(async (req, res) => {
  res.json(await login(req.body, ip(req)));
}));
authRouter.post('/refresh', validate({ body: refreshSchema }), asyncHandler(async (req, res) => {
  res.json(await refresh(req.body, ip(req)));
}));
authRouter.post('/logout', validate({ body: refreshSchema.partial() }), asyncHandler(async (req, res) => {
  res.json(await logout(req.body));
}));
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { serializeUser } = await import('../utils/serializers.js');
  res.json({ user: serializeUser(req.user) });
}));
authRouter.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), asyncHandler(async (req, res) => {
  res.json(await changePassword(req.user.id, req.body, ip(req)));
}));
