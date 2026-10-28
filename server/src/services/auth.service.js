import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../utils/tokens.js';
import { serializeUser } from '../utils/serializers.js';
import { badRequest, forbidden, unauthorized } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

export function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function issueSession(client, user, ipAddress) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await client.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  await client.activityLog.create({
    data: {
      userId: user.id,
      action: 'login',
      module: 'Auth',
      recordType: 'user',
      recordId: user.id,
      description: `${user.name} signed in`,
      ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function login({ email, password }, ipAddress = null) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw forbidden('This account has been disabled', 'ACCOUNT_DISABLED');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const now = new Date();
  const session = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });
    const tokens = await issueSession(tx, updatedUser, ipAddress);
    return { ...tokens, user: updatedUser };
  });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: serializeUser(session.user),
  };
}

export async function refresh({ refreshToken }, ipAddress = null) {
  const tokenHash = hashToken(refreshToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt <= new Date()) {
    throw unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (!record.user.isActive) {
    throw forbidden('This account has been disabled', 'ACCOUNT_DISABLED');
  }

  const newRefreshToken = generateRefreshToken();

  const session = await prisma.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count === 0) {
      throw unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    await tx.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        userId: record.userId,
        expiresAt: refreshTokenExpiry(),
      },
    });

    await tx.activityLog.create({
      data: {
        userId: record.userId,
        action: 'refresh_token',
        module: 'Auth',
        recordType: 'user',
        recordId: record.userId,
        description: `${record.user.name} refreshed their session`,
        ipAddress,
      },
    });

    return {
      accessToken: signAccessToken(record.user),
      user: record.user,
    };
  });

  return {
    accessToken: session.accessToken,
    refreshToken: newRefreshToken,
    user: serializeUser(session.user),
  };
}

export async function logout({ refreshToken }) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return { success: true };
}

export async function changePassword(userId, { currentPassword, newPassword }, ipAddress = null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized('Invalid access token', 'INVALID_TOKEN');

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw badRequest('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    await tx.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await logActivity(tx, {
      userId: user.id,
      action: 'change_password',
      module: 'Auth',
      recordType: 'user',
      recordId: user.id,
      description: `${user.name} changed their password`,
      ipAddress,
    });
  });

  return { success: true };
}
