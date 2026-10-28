import { prisma } from '../config/prisma.js';
import { DEFAULT_SETTINGS, PUBLIC_SETTING_KEYS } from '../config/defaultSettings.js';
import { getCache, setCache, clearCache } from '../middleware/cache.js';
import { badRequest } from '../utils/errors.js';
import { logActivity } from './activity.service.js';

const CACHE_KEY = 'settings:all';

function parseValue(key, value) {
  if (key === 'livePollingMs') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(DEFAULT_SETTINGS.livePollingMs);
  }
  if (key === 'enableWebSocket') {
    return value === true || value === 'true' || value === '1';
  }
  return value;
}

export async function getSettingsMap({ fresh = false } = {}) {
  if (!fresh) {
    const cached = getCache(CACHE_KEY);
    if (cached) return cached;
  }

  const rows = await prisma.setting.findMany();
  const values = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    values[row.key] = row.value;
  }

  const parsed = {};
  for (const [key, value] of Object.entries(values)) {
    parsed[key] = parseValue(key, value);
  }

  setCache(CACHE_KEY, parsed, 60_000);
  return parsed;
}

export async function getPublicSettings() {
  const settings = await getSettingsMap();
  return Object.fromEntries(PUBLIC_SETTING_KEYS.map((key) => [key, settings[key]]));
}

export async function updateSettings(entries, actor, ipAddress = null) {
  const keys = Object.keys(entries ?? {});
  if (!keys.length) throw badRequest('No settings were provided');

  const unknown = keys.filter((key) => !(key in DEFAULT_SETTINGS));
  if (unknown.length) {
    throw badRequest(`Unknown setting keys: ${unknown.join(', ')}`);
  }

  await prisma.$transaction(async (tx) => {
    for (const key of keys) {
      const value = String(entries[key]);
      await tx.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'Settings',
      recordType: 'settings',
      recordId: 'site',
      description: `Updated settings: ${keys.join(', ')}`,
      ipAddress,
    });
  });

  clearCache(CACHE_KEY);
  return getSettingsMap({ fresh: true });
}
