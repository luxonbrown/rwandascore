export function diffFields(before, after, fields) {
  const changes = [];

  for (const [field, label] of Object.entries(fields)) {
    const oldValue = before?.[field];
    const newValue = after?.[field];

    const normalise = (value) => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    if (normalise(oldValue) !== normalise(newValue)) {
      changes.push(`${label}: ${normalise(oldValue) || '—'} → ${normalise(newValue) || '—'}`);
    }
  }

  return changes;
}

export function describeChanges(changes, fallback = 'No changes') {
  return changes.length ? changes.join('; ') : fallback;
}
