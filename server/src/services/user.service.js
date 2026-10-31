import { prisma } from '../config/prisma.js';
import { serializeUser } from '../utils/serializers.js';
import { conflict, notFound, badRequest } from '../utils/errors.js';
import { generateTempPassword } from '../utils/tokens.js';
import { logActivity } from './activity.service.js';
import { hashPassword } from './auth.service.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  managedTeam: { select: { id: true, name: true } },
};

async function ensureNotLastAdmin(client, userId) {
  const target = await client.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== 'ADMIN') return;

  const [admins, activeAdmins] = await Promise.all([
    client.user.count({ where: { role: 'ADMIN' } }),
    client.user.count({ where: { role: 'ADMIN', isActive: true } }),
  ]);

  if (admins <= 1 || (target.isActive && activeAdmins <= 1)) {
    throw conflict('The system must retain its single administrator account and one active administrator', 'LAST_ADMIN');
  }
}

async function withUserCapacityLock(tx, action) {
  const lock = await tx.$queryRaw`SELECT GET_LOCK('rwandascore:user-capacity', 5) AS acquired`;
  if (Number(lock?.[0]?.acquired) !== 1) {
    throw conflict('User capacity is being updated. Please retry.', 'USER_CAPACITY_BUSY');
  }
  try {
    return await action();
  } finally {
    await tx.$queryRaw`SELECT RELEASE_LOCK('rwandascore:user-capacity')`;
  }
}

async function ensureRoleCapacity(client, role) {
  if (role === 'ADMIN') {
    const admins = await client.user.count({ where: { role: 'ADMIN' } });
    if (admins >= 1) throw conflict('RwandaScore supports exactly one administrator account', 'ADMIN_LIMIT');
  }
  if (role === 'EDITOR') {
    const editors = await client.user.count({ where: { role: 'EDITOR' } });
    if (editors >= 5) throw conflict('RwandaScore supports up to five editor accounts', 'EDITOR_LIMIT');
  }
}

export async function listUsers({ page = 1, pageSize = 20, search = '', role, isActive }) {
  const where = {
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: users.map(serializeUser),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw notFound('User not found');
  return serializeUser(user);
}

export async function createUser(data, actor, ipAddress = null) {
  const tempPassword = data.password || generateTempPassword();
  const email = data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('A user with this email already exists', 'DUPLICATE');

  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.$transaction(async (tx) => {
    return withUserCapacityLock(tx, async () => {
      const role = data.role ?? 'EDITOR';
      await ensureRoleCapacity(tx, role);
      if (role === 'TEAM_MANAGER') {
        const team = await tx.team.findUnique({ where: { id: data.teamId } });
        if (!team) throw notFound('Team not found');
        if (team.managerUserId) throw conflict('This team already has a manager', 'TEAM_ALREADY_MANAGED');
      }
      const created = await tx.user.create({
        data: {
          name: data.name,
          email,
          passwordHash,
          role,
          isActive: data.isActive ?? true,
          mustChangePassword: data.mustChangePassword ?? true,
        },
        select: userSelect,
      });

      if (role === 'TEAM_MANAGER') await tx.team.update({ where: { id: data.teamId }, data: { managerUserId: created.id } });
      const hydrated = await tx.user.findUnique({ where: { id: created.id }, select: userSelect });

      await logActivity(tx, {
        userId: actor?.id,
        action: 'create',
        module: 'Users',
        recordType: 'user',
        recordId: hydrated.id,
        description: `Created user ${hydrated.name} (${hydrated.role})`,
        ipAddress,
      });
      return hydrated;
    });
  }, { maxWait: 10_000, timeout: 30_000 });

  return { ...serializeUser(user), ...(data.password ? {} : { tempPassword }) };
}

export async function updateUser(userId, data, actor, ipAddress = null) {
  const user = await prisma.$transaction(async (tx) => {
   return withUserCapacityLock(tx, async () => {
    const existing = await tx.user.findUnique({ where: { id: userId } });
    if (!existing) throw notFound('User not found');

    const willLoseAdmin =
      existing.role === 'ADMIN' &&
      ((data.role !== undefined && data.role !== 'ADMIN') ||
        (data.isActive !== undefined && data.isActive === false));

    if (willLoseAdmin) await ensureNotLastAdmin(tx, userId);
    if (data.role && data.role !== existing.role) await ensureRoleCapacity(tx, data.role);
    const nextRole = data.role ?? existing.role;
    if (nextRole !== 'TEAM_MANAGER' && data.teamId) throw badRequest('Only team managers can be assigned to a team');
    const currentManagedTeam = await tx.team.findUnique({ where: { managerUserId: userId }, select: { id: true } });
    const targetTeamId = data.teamId || currentManagedTeam?.id;
    if (nextRole === 'TEAM_MANAGER' && !targetTeamId) throw badRequest('A team must be assigned to a team manager');

    if (actor?.id === userId && data.isActive === false) {
      throw badRequest('You cannot deactivate your own account');
    }

    if (data.email && data.email.toLowerCase().trim() !== existing.email) {
      const email = data.email.toLowerCase().trim();
      const duplicate = await tx.user.findUnique({ where: { email } });
      if (duplicate) throw conflict('A user with this email already exists', 'DUPLICATE');
    }

    const updateData = {};
    for (const field of ['name', 'role', 'isActive', 'mustChangePassword']) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();

    if (existing.role === 'TEAM_MANAGER' && (nextRole !== 'TEAM_MANAGER' || (targetTeamId && targetTeamId !== currentManagedTeam?.id))) {
      await tx.team.updateMany({ where: { managerUserId: userId }, data: { managerUserId: null } });
    }
    if (nextRole === 'TEAM_MANAGER' && targetTeamId) {
      const team = await tx.team.findUnique({ where: { id: targetTeamId } });
      if (!team) throw notFound('Team not found');
      if (team.managerUserId && team.managerUserId !== userId) throw conflict('This team already has a manager', 'TEAM_ALREADY_MANAGED');
      await tx.team.update({ where: { id: team.id }, data: { managerUserId: userId } });
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelect,
    });

    const changes = Object.keys(updateData).map((field) => `${field}: ${existing[field]} → ${updated[field]}`);
    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Users',
      recordType: 'user',
      recordId: updated.id,
      description: `Updated user ${updated.name}${changes.length ? ` (${changes.join(', ')})` : ''}`,
      ipAddress,
    });

    return updated;
   });
  }, { maxWait: 10_000, timeout: 30_000 });

  return serializeUser(user);
}

export async function deleteUser(userId, actor, ipAddress = null) {
  if (actor?.id === userId) {
    throw badRequest('You cannot delete your own account');
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id: userId } });
    if (!existing) throw notFound('User not found');

    await ensureNotLastAdmin(tx, userId);

    await tx.user.delete({ where: { id: userId } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Users',
      recordType: 'user',
      recordId: userId,
      description: `Deleted user ${existing.name} (${existing.email})`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function resetUserPassword(userId, { newPassword } = {}, actor, ipAddress = null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  const tempPassword = newPassword || generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
      select: userSelect,
    });

    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'reset_password',
      module: 'Users',
      recordType: 'user',
      recordId: userId,
      description: `Reset password for ${user.name}`,
      ipAddress,
    });

    return result;
  });

  return {
    user: serializeUser(updated),
    tempPassword,
  };
}
