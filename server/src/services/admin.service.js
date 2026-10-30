import { prisma } from '../config/prisma.js';
import { badRequest, notFound } from '../utils/errors.js';
import { uniqueSlug } from '../utils/slug.js';
import { diffFields, describeChanges } from '../utils/diff.js';
import {
  serializeActivity,
  serializeCompetition,
  serializePlayer,
  serializeSeason,
  serializeStadium,
  serializeTeam,
} from '../utils/serializers.js';
import { logActivity } from './activity.service.js';

function parseDate(value) {
  return value ? new Date(value) : null;
}

export async function listSeasons({ competitionId, page = 1, pageSize = 20 } = {}) {
  const where = competitionId ? { competitionId } : {};
  const [total, seasons] = await Promise.all([
    prisma.season.count({ where }),
    prisma.season.findMany({
      where,
      include: { competition: true },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: seasons.map((season) => ({
      ...serializeSeason(season),
      competition: season.competition ? serializeCompetition(season.competition) : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createSeason(data, actor, ipAddress = null) {
  const competition = await prisma.competition.findUnique({ where: { id: data.competitionId } });
  if (!competition) throw badRequest('Competition not found');

  const season = await prisma.$transaction(async (tx) => {
    if (data.isCurrent) {
      await tx.season.updateMany({
        where: { competitionId: data.competitionId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const created = await tx.season.create({
      data: {
        competitionId: data.competitionId,
        name: data.name,
        startDate: parseDate(data.startDate),
        endDate: parseDate(data.endDate),
        isCurrent: data.isCurrent ?? false,
      },
      include: { competition: true },
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Seasons',
      recordType: 'season',
      recordId: created.id,
      description: `Created season ${created.name} for ${competition.name}`,
      ipAddress,
    });

    return created;
  });

  return {
    ...serializeSeason(season),
    competition: serializeCompetition(season.competition),
  };
}

export async function updateSeason(id, data, actor, ipAddress = null) {
  const season = await prisma.$transaction(async (tx) => {
    const existing = await tx.season.findUnique({ where: { id }, include: { competition: true } });
    if (!existing) throw notFound('Season not found');

    if (data.competitionId && data.competitionId !== existing.competitionId) {
      const competition = await tx.competition.findUnique({ where: { id: data.competitionId } });
      if (!competition) throw badRequest('Competition not found');
    }

    if (data.isCurrent) {
      await tx.season.updateMany({
        where: {
          competitionId: data.competitionId ?? existing.competitionId,
          isCurrent: true,
          id: { not: id },
        },
        data: { isCurrent: false },
      });
    }

    const updateData = {};
    for (const field of ['name', 'isCurrent']) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.competitionId !== undefined) updateData.competitionId = data.competitionId;
    if (data.startDate !== undefined) updateData.startDate = parseDate(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = parseDate(data.endDate);

    const updated = await tx.season.update({
      where: { id },
      data: updateData,
      include: { competition: true },
    });

    const changes = diffFields(existing, updated, {
      name: 'Name',
      competitionId: 'Competition',
      startDate: 'Start date',
      endDate: 'End date',
      isCurrent: 'Current season',
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Seasons',
      recordType: 'season',
      recordId: id,
      description: describeChanges(changes, `Updated season ${updated.name}`),
      ipAddress,
    });

    return updated;
  });

  return {
    ...serializeSeason(season),
    competition: serializeCompetition(season.competition),
  };
}

export async function deleteSeason(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.season.findUnique({ where: { id } });
    if (!existing) throw notFound('Season not found');

    await tx.season.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Seasons',
      recordType: 'season',
      recordId: id,
      description: `Deleted season ${existing.name}`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function listStadiums({ page = 1, pageSize = 50, search } = {}) {
  const where = search ? { name: { contains: search } } : {};
  const [total, stadiums] = await Promise.all([
    prisma.stadium.count({ where }),
    prisma.stadium.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: stadiums.map(serializeStadium),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createStadium(data, actor, ipAddress = null) {
  const stadium = await prisma.$transaction(async (tx) => {
    const created = await tx.stadium.create({
      data: {
        name: data.name,
        city: data.city,
        capacity: data.capacity ?? null,
      },
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Stadiums',
      recordType: 'stadium',
      recordId: created.id,
      description: `Created stadium ${created.name}`,
      ipAddress,
    });

    return created;
  });

  return serializeStadium(stadium);
}

export async function updateStadium(id, data, actor, ipAddress = null) {
  const stadium = await prisma.$transaction(async (tx) => {
    const existing = await tx.stadium.findUnique({ where: { id } });
    if (!existing) throw notFound('Stadium not found');

    const updateData = {};
    for (const field of ['name', 'city', 'capacity']) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    const updated = await tx.stadium.update({ where: { id }, data: updateData });
    const changes = diffFields(existing, updated, {
      name: 'Name',
      city: 'City',
      capacity: 'Capacity',
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Stadiums',
      recordType: 'stadium',
      recordId: id,
      description: describeChanges(changes, `Updated stadium ${updated.name}`),
      ipAddress,
    });

    return updated;
  });

  return serializeStadium(stadium);
}

export async function deleteStadium(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.stadium.findUnique({ where: { id } });
    if (!existing) throw notFound('Stadium not found');

    await tx.stadium.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Stadiums',
      recordType: 'stadium',
      recordId: id,
      description: `Deleted stadium ${existing.name}`,
      ipAddress,
    });
  });

  return { success: true };
}

async function resolveTeamStadium(tx, data) {
  const name = typeof data.stadium === 'string' ? data.stadium.trim() : '';
  if (name) {
    const city = data.city?.trim();
    return (await tx.stadium.upsert({
      where: { name_city: { name, city } },
      update: {},
      create: { name, city },
      select: { id: true },
    })).id;
  }

  if (data.stadiumId) {
    const stadium = await tx.stadium.findUnique({ where: { id: data.stadiumId }, select: { id: true } });
    if (!stadium) throw badRequest('Stadium not found');
    return stadium.id;
  }

  return null;
}

export async function createTeam(data, actor, ipAddress = null) {
  const slug = await uniqueSlug(prisma.team, data.name);

  const team = await prisma.$transaction(async (tx) => {
    const stadiumId = await resolveTeamStadium(tx, data);
    const created = await tx.team.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        initials: data.initials,
        slug,
        city: data.city,
        stadiumId,
        founded: data.founded ?? null,
        nickname: data.nickname ?? null,
        coach: data.coach ?? null,
        primaryColor: data.primaryColor ?? '#FF6B00',
        secondaryColor: data.secondaryColor ?? '#121212',
        logoUrl: data.logoUrl ?? null,
        isNational: data.isNational ?? false,
        description: data.description ?? null,
      },
      include: { stadium: true },
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Teams',
      recordType: 'team',
      recordId: created.id,
      description: `Created team ${created.name}`,
      ipAddress,
    });

    return created;
  });

  return serializeTeam(team);
}

export async function updateTeam(id, data, actor, ipAddress = null) {
  const team = await prisma.$transaction(async (tx) => {
    const existing = await tx.team.findUnique({ where: { id } });
    if (!existing) throw notFound('Team not found');

    const updateData = {};
    if (data.stadium !== undefined || data.stadiumId !== undefined) {
      updateData.stadiumId = await resolveTeamStadium(tx, {
        ...data,
        city: data.city ?? existing.city,
      });
    }
    for (const field of [
      'name',
      'shortName',
      'initials',
      'city',
      'founded',
      'nickname',
      'coach',
      'primaryColor',
      'secondaryColor',
      'logoUrl',
      'isNational',
      'description',
    ]) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    if (data.name && data.name !== existing.name) {
      updateData.slug = await uniqueSlug(tx.team, data.name, id);
    } else if (data.slug) {
      updateData.slug = await uniqueSlug(tx.team, data.slug, id);
    }

    const updated = await tx.team.update({
      where: { id },
      data: updateData,
      include: { stadium: true },
    });

    const changes = diffFields(existing, updated, {
      name: 'Name',
      shortName: 'Short name',
      city: 'City',
      stadiumId: 'Stadium',
      coach: 'Coach',
      primaryColor: 'Primary color',
      secondaryColor: 'Secondary color',
      isNational: 'National team',
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Teams',
      recordType: 'team',
      recordId: id,
      description: describeChanges(changes, `Updated team ${updated.name}`),
      ipAddress,
    });

    return updated;
  });

  return serializeTeam(team);
}

export async function deleteTeam(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.team.findUnique({ where: { id } });
    if (!existing) throw notFound('Team not found');

    await tx.team.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Teams',
      recordType: 'team',
      recordId: id,
      description: `Deleted team ${existing.name}`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function createPlayer(data, actor, ipAddress = null) {
  if (data.teamId) {
    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) throw badRequest('Team not found');
  }

  const slug = await uniqueSlug(prisma.player, data.name);

  const player = await prisma.$transaction(async (tx) => {
    const created = await tx.player.create({
      data: {
        name: data.name,
        slug,
        teamId: data.teamId ?? null,
        position: data.position ?? 'MF',
        number: data.number ?? null,
        nationality: data.nationality ?? 'Rwanda',
        age: data.age ?? null,
        dateOfBirth: parseDate(data.dateOfBirth),
        height: data.height ?? null,
        foot: data.foot ?? null,
        photoUrl: data.faceId ?? data.photoUrl ?? null,
        isNationalTeam: data.isNationalTeam ?? false,
        bio: data.bio ?? null,
        appearances: data.appearances ?? 0,
        goals: data.goals ?? 0,
        assists: data.assists ?? 0,
        yellowCards: data.yellowCards ?? 0,
        redCards: data.redCards ?? 0,
        minutes: data.minutes ?? 0,
        cleanSheets: data.cleanSheets ?? 0,
      },
      include: { team: { include: { stadium: true } } },
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Players',
      recordType: 'player',
      recordId: created.id,
      description: `Created player ${created.name}`,
      ipAddress,
    });

    return created;
  }, { maxWait: 10_000, timeout: 15_000 });

  return serializePlayer(player);
}

export async function updatePlayer(id, data, actor, ipAddress = null) {
  if (data.teamId) {
    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) throw badRequest('Team not found');
  }

  const player = await prisma.$transaction(async (tx) => {
    const existing = await tx.player.findUnique({ where: { id } });
    if (!existing) throw notFound('Player not found');

    const updateData = {};
    for (const field of [
      'name',
      'position',
      'number',
      'nationality',
      'age',
      'height',
      'foot',
      'photoUrl',
      'isNationalTeam',
      'bio',
      'appearances',
      'goals',
      'assists',
      'yellowCards',
      'redCards',
      'minutes',
      'cleanSheets',
    ]) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    // Prisma's checked update input exposes the relation as `team`, while the
    // scalar `teamId` belongs to the unchecked input. Use the relation form so
    // team reassignment works reliably with the generated client.
    if (data.teamId !== undefined) {
      updateData.team = data.teamId ? { connect: { id: data.teamId } } : { disconnect: true };
    }
    if (data.faceId !== undefined) updateData.photoUrl = data.faceId;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = parseDate(data.dateOfBirth);

    if (data.name && data.name !== existing.name) {
      updateData.slug = await uniqueSlug(tx.player, data.name, id);
    }

    const updated = await tx.player.update({
      where: { id },
      data: updateData,
      include: { team: { include: { stadium: true } } },
    });

    const changes = diffFields(existing, updated, {
      name: 'Name',
      teamId: 'Team',
      position: 'Position',
      number: 'Number',
      nationality: 'Nationality',
      dateOfBirth: 'Date of birth',
      isNationalTeam: 'National team',
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Players',
      recordType: 'player',
      recordId: id,
      description: describeChanges(changes, `Updated player ${updated.name}`),
      ipAddress,
    });

    return updated;
  }, { maxWait: 10_000, timeout: 15_000 });

  return serializePlayer(player);
}

export async function deletePlayer(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.player.findUnique({ where: { id } });
    if (!existing) throw notFound('Player not found');

    await tx.player.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Players',
      recordType: 'player',
      recordId: id,
      description: `Deleted player ${existing.name}`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function createCompetition(data, actor, ipAddress = null) {
  const slug = await uniqueSlug(prisma.competition, data.slug || data.name);

  const competition = await prisma.$transaction(async (tx) => {
    const created = await tx.competition.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        slug,
        country: data.country ?? 'Rwanda',
        type: data.type ?? 'league',
        logoUrl: data.logoUrl ?? null,
        logoText: data.logoText ?? null,
        primaryColor: data.primaryColor ?? '#FF6B00',
        secondaryColor: data.secondaryColor ?? '#121212',
        description: data.description ?? null,
        teamCount: data.teamCount ?? 0,
      },
    });

    const seasonName = data.season?.trim();
    const season = seasonName
      ? await tx.season.create({
          data: { competitionId: created.id, name: seasonName, isCurrent: true },
        })
      : null;

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'Competitions',
      recordType: 'competition',
      recordId: created.id,
      description: `Created competition ${created.name}`,
      ipAddress,
    });

    return { competition: created, season };
  });

  return {
    ...serializeCompetition(competition.competition),
    season: competition.season?.name ?? null,
    currentSeason: competition.season ? serializeSeason(competition.season) : null,
  };
}

export async function updateCompetition(id, data, actor, ipAddress = null) {
  const competition = await prisma.$transaction(async (tx) => {
    const existing = await tx.competition.findUnique({ where: { id } });
    if (!existing) throw notFound('Competition not found');
    let season = await tx.season.findFirst({ where: { competitionId: id, isCurrent: true } });

    const updateData = {};
    for (const field of [
      'name',
      'shortName',
      'country',
      'type',
      'logoUrl',
      'logoText',
      'primaryColor',
      'secondaryColor',
      'description',
      'teamCount',
    ]) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    if (data.name && data.name !== existing.name) {
      updateData.slug = await uniqueSlug(tx.competition, data.name, id);
    } else if (data.slug) {
      updateData.slug = await uniqueSlug(tx.competition, data.slug, id);
    }

    if (data.season !== undefined) {
      const seasonName = data.season.trim();
      await tx.season.updateMany({
        where: { competitionId: id, isCurrent: true },
        data: { isCurrent: false },
      });
      season = seasonName
        ? await tx.season.upsert({
            where: { competitionId_name: { competitionId: id, name: seasonName } },
            update: { isCurrent: true },
            create: { competitionId: id, name: seasonName, isCurrent: true },
          })
        : null;
    }

    const updated = await tx.competition.update({ where: { id }, data: updateData });

    const changes = diffFields(existing, updated, {
      name: 'Name',
      shortName: 'Short name',
      type: 'Type',
      country: 'Country',
      teamCount: 'Team count',
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Competitions',
      recordType: 'competition',
      recordId: id,
      description: describeChanges(changes, `Updated competition ${updated.name}`),
      ipAddress,
    });

    return { competition: updated, season };
  });

  return {
    ...serializeCompetition(competition.competition),
    season: competition.season?.name ?? null,
    currentSeason: competition.season ? serializeSeason(competition.season) : null,
  };
}

export async function deleteCompetition(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.competition.findUnique({ where: { id } });
    if (!existing) throw notFound('Competition not found');

    await tx.competition.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'Competitions',
      recordType: 'competition',
      recordId: id,
      description: `Deleted competition ${existing.name}`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function listActivityLogs({
  page = 1,
  pageSize = 20,
  module,
  action,
  userId,
  search,
  from,
  to,
} = {}) {
  const where = {
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search } },
            { user: { name: { contains: search } } },
          ],
        }
      : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: logs.map(serializeActivity),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
