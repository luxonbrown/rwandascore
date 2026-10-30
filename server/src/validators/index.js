import { z } from 'zod';

const id = z.string().min(1);
const optionalId = z.string().min(1).optional();
const nullableId = z.string().min(1).nullable().optional();
const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');
const nullableDate = isoDate.nullable().optional();
export const managerMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
const nullableInteger = (min, max = Number.MAX_SAFE_INTEGER) => z.preprocess(
  (value) => value === '' ? null : value,
  z.coerce.number().int().min(min).max(max).nullable().optional(),
);
const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

const matchStatus = z.enum(['scheduled', 'live', 'ht', 'ft', 'postponed']);
const eventType = z.enum(['goal', 'own_goal', 'penalty', 'yellow', 'red', 'substitution', 'shot', 'shot_on_target', 'shot_off_target', 'save', 'position']);
const position = z.enum(['GK', 'DF', 'MF', 'FW']);
const competitionType = z.enum(['league', 'cup', 'national']);

export const idParam = z.object({ id });

export const paginationQuery = z.object({ page, pageSize });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const matchListQuery = z.object({
  page,
  pageSize,
  competitionId: optionalId,
  teamId: optionalId,
  competition: optionalId,
  team: optionalId,
  status: matchStatus.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  round: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(['kickoffAt', 'createdAt', 'round', 'status']).default('kickoffAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const matchCreateSchema = z.object({
  competitionId: id,
  seasonId: id,
  homeTeamId: id,
  awayTeamId: id,
  kickoffAt: isoDate,
  status: matchStatus.optional(),
  minute: z.coerce.number().int().min(0).max(130).optional(),
  round: z.string().max(80).optional(),
  venue: z.string().max(160).optional(),
  city: z.string().max(120).optional(),
  stadiumId: nullableId,
  referee: z.string().max(120).optional(),
  attendance: z.coerce.number().int().min(0).max(200000).optional(),
});

export const matchUpdateSchema = matchCreateSchema.partial().extend({
  version: z.coerce.number().int().min(1),
});

export const matchStatusSchema = z.object({
  version: z.coerce.number().int().min(1),
  status: matchStatus.optional(),
  minute: z.coerce.number().int().min(0).max(130).optional(),
});

const lineupSideSchema = z.object({
  formation: z.enum(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']),
  starters: z.array(id).min(1).max(11),
  bench: z.array(id).max(12),
}).superRefine((lineup, ctx) => {
  const ids = [...lineup.starters, ...lineup.bench];
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A player can only appear once in a lineup' });
  }
});

export const matchLineupsUpdateSchema = z.object({
  version: z.coerce.number().int().min(1),
  lineups: z.object({
    home: lineupSideSchema,
    away: lineupSideSchema,
  }),
});

export const matchVersionSchema = z.object({ version: z.coerce.number().int().min(1) });
export const liveActionSchema = z.object({
  version: z.coerce.number().int().min(1),
  minute: z.coerce.number().int().min(0).max(130).optional(),
});

export const eventCreateSchema = z.object({
  version: z.coerce.number().int().min(1),
  teamId: id,
  playerId: nullableId,
  relatedPlayerId: nullableId,
  type: eventType,
  minute: z.coerce.number().int().min(0).max(130),
  note: z.string().max(500).optional(),
  x: z.coerce.number().min(0).max(100).optional(),
  y: z.coerce.number().min(0).max(100).optional(),
});

export const newsListQuery = z.object({
  page,
  pageSize,
  category: z.string().max(80).optional(),
  status: z.enum(['draft', 'published']).optional(),
  search: z.string().max(120).optional(),
  featured: booleanString.optional(),
});

const normalizeNewsPayload = (value) => {
  if (!value || typeof value !== 'object') return value
  const next = { ...value }
  if (next.content === undefined && typeof next.body === 'string') next.content = next.body
  if (next.imageUrl === undefined && typeof next.image === 'string') next.imageUrl = next.image
  if (next.imageUrl === '') next.imageUrl = null
  delete next.body
  delete next.image
  return next
}

const newsCreateBase = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.string().min(1).max(80),
  imageUrl: z.string().max(1000).nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
});

export const newsCreateSchema = z.preprocess(normalizeNewsPayload, newsCreateBase);

export const newsUpdateSchema = z.preprocess(normalizeNewsPayload, newsCreateBase.partial());

const normalizeTeamPayload = (value) => {
  if (!value || typeof value !== 'object') return value;
  const next = { ...value };
  if (next.coach && typeof next.coach === 'object') {
    next.coach = typeof next.coach.name === 'string' && next.coach.name.trim() ? next.coach.name : null;
  }
  if (next.colors && typeof next.colors === 'object') {
    if (next.primaryColor === undefined && next.colors.primary !== undefined) next.primaryColor = next.colors.primary;
    if (next.secondaryColor === undefined && next.colors.secondary !== undefined) next.secondaryColor = next.colors.secondary;
  }
  if (next.logoUrl === undefined && typeof next.logo === 'string') next.logoUrl = next.logo;
  if (next.isNational === undefined && next.national !== undefined) next.isNational = Boolean(next.national);
  if (next.logoUrl === '') next.logoUrl = null;
  if (next.stadiumId === '') next.stadiumId = null;
  if (next.founded === '') next.founded = null;
  if ((next.initials === undefined || next.initials === '') && typeof next.shortName === 'string' && next.shortName.trim()) {
    next.initials = next.shortName.trim().slice(0, 3).toUpperCase();
  }
  delete next.colors;
  delete next.logo;
  delete next.national;
  delete next.competitionIds;
  delete next.coachNationality;
  return next;
};

const teamCreateBase = z.object({
  name: z.string().min(2).max(120),
  shortName: z.string().min(2).max(40),
  initials: z.string().min(1).max(6),
  city: z.string().min(1).max(120),
  stadium: z.string().trim().max(120).nullable().optional(),
  stadiumId: nullableId,
  founded: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  nickname: z.string().max(120).nullable().optional(),
  coach: z.string().max(120).nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().nullable().optional(),
  isNational: z.boolean().optional(),
  description: z.string().max(5000).nullable().optional(),
});

export const teamCreateSchema = z.preprocess(normalizeTeamPayload, teamCreateBase);

export const teamUpdateSchema = z.preprocess(normalizeTeamPayload, teamCreateBase.partial().extend({
  slug: z.string().max(120).optional(),
}));

export const playerCreateSchema = z.object({
  name: z.string().min(2).max(120),
  teamId: nullableId,
  position: z.preprocess((value) => value === 'ALL' ? undefined : value, position.optional()),
  number: nullableInteger(0, 99),
  nationality: z.string().max(80).optional(),
  age: nullableInteger(14, 100),
  dateOfBirth: nullableDate,
  height: nullableInteger(100, 250),
  foot: z.enum(['Left', 'Right', 'Both']).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  isNationalTeam: z.boolean().optional(),
  bio: z.string().max(5000).nullable().optional(),
  appearances: nullableInteger(0),
  goals: nullableInteger(0),
  assists: nullableInteger(0),
  yellowCards: nullableInteger(0),
  redCards: nullableInteger(0),
  minutes: nullableInteger(0),
  cleanSheets: nullableInteger(0),
});

export const playerUpdateSchema = playerCreateSchema.partial();

export const playerListQuery = z.object({
  page,
  pageSize,
  teamId: optionalId,
  nationalTeam: booleanString.optional(),
  search: z.string().max(120).optional(),
  position: position.optional(),
  sort: z.enum(['name', 'age', 'goals', 'assists', 'appearances']).default('name'),
});

export const competitionCreateSchema = z.object({
  name: z.string().min(2).max(160),
  shortName: z.string().min(2).max(40),
  slug: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  type: competitionType.optional(),
  logoUrl: z.string().url().nullable().optional(),
  logoText: z.string().trim().max(4).nullable().optional(),
  season: z.string().trim().max(80).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(5000).nullable().optional(),
  teamCount: z.coerce.number().int().min(0).max(200).optional(),
});

export const competitionUpdateSchema = competitionCreateSchema.partial().extend({
  slug: z.string().max(160).optional(),
});

export const seasonCreateSchema = z.object({
  competitionId: id,
  name: z.string().min(2).max(80),
  startDate: nullableDate,
  endDate: nullableDate,
  isCurrent: z.boolean().optional(),
});

export const seasonUpdateSchema = seasonCreateSchema.partial();

export const seasonListQuery = z.object({
  page,
  pageSize,
  competitionId: optionalId,
});

export const stadiumCreateSchema = z.object({
  name: z.string().min(2).max(160),
  city: z.string().min(1).max(120),
  capacity: z.coerce.number().int().min(0).max(200000).nullable().optional(),
});

export const stadiumUpdateSchema = stadiumCreateSchema.partial();

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'TEAM_MANAGER']).optional(),
  teamId: nullableId,
  password: z.string().min(8).max(128).optional(),
  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'TEAM_MANAGER' && !data.teamId) ctx.addIssue({ code: 'custom', path: ['teamId'], message: 'A team is required for a team manager' });
  if (data.role !== 'TEAM_MANAGER' && data.teamId) ctx.addIssue({ code: 'custom', path: ['teamId'], message: 'Only team managers can be assigned to a team' });
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'TEAM_MANAGER']).optional(),
  teamId: nullableId,
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128).optional(),
});

export const settingsUpdateSchema = z.object({
  settings: z.record(z.string()),
});

export const activityListQuery = z.object({
  page,
  pageSize,
  module: z.string().max(80).optional(),
  action: z.string().max(80).optional(),
  userId: optionalId,
  search: z.string().max(160).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const searchQuery = z.object({
  q: z.string().trim().min(2).max(120),
});

export const standingsQuery = z.object({
  seasonId: optionalId,
});

export const teamListQuery = z.object({
  page,
  pageSize,
  search: z.string().max(120).optional(),
  competitionId: optionalId,
});

export const newsPublishSchema = z.object({
  published: z.boolean(),
});

export const uploadDeleteSchema = z.object({
  filename: z.string().min(1).max(255),
});
