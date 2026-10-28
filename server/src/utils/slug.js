export function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function uniqueSlug(delegate, base, excludeId = undefined) {
  const root = slugify(base) || 'item';
  let candidate = root;
  let suffix = 2;

  for (;;) {
    const existing = await delegate.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}
