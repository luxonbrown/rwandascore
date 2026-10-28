const store = new Map();

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 60_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearCache(prefix = undefined) {
  if (!prefix) {
    store.clear();
    return;
  }

  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
