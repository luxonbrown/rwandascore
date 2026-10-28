import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function durationToMs(value, fallbackMs) {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(value).trim());
  if (!match) return fallbackMs;
  return Number(match[1]) * UNIT_MS[match[2].toLowerCase()];
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry() {
  const ms = durationToMs(env.JWT_REFRESH_EXPIRES_IN, 7 * UNIT_MS.d);
  return new Date(Date.now() + ms);
}

export function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url');
}
