import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/auth.service.js';

const prisma = new PrismaClient();
const seasonName = (() => { const now = new Date(); const year = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1; return `${year}/${String(year + 1).slice(-2)}`; })();
const temporaryPassword = () => `Rw!${randomBytes(12).toString('base64url')}9`;

async function main() {
  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const editors = await prisma.user.count({ where: { role: 'EDITOR' } });
  if (admins > 1 || editors > 5) throw new Error('Existing user counts violate the one-admin/five-editor policy; resolve users before seeding.');
  const credentials = [];
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@rwandascore.rw';
  const adminName = process.env.SEED_ADMIN_NAME || 'RwandaScore Administrator';
  if (!admins) {
    const password = temporaryPassword();
    await prisma.user.create({ data: { name: adminName, email: adminEmail, role: 'ADMIN', passwordHash: await hashPassword(password), mustChangePassword: true } });
    credentials.push({ role: 'ADMIN', email: adminEmail, password });
  }
  for (let i = 1; i <= 5 - editors; i += 1) {
    const email = `editor${i}@rwandascore.rw`;
    if (await prisma.user.findUnique({ where: { email } })) continue;
    const password = temporaryPassword();
    await prisma.user.create({ data: { name: `RwandaScore Editor ${i}`, email, role: 'EDITOR', passwordHash: await hashPassword(password), mustChangePassword: true } });
    credentials.push({ role: 'EDITOR', email, password });
  }
  const competitions = [
    { name: 'Rwanda Premier League', shortName: 'RPL', slug: 'rwanda-premier-league', type: 'league', primaryColor: '#176B45' },
    { name: 'Rwanda Peace Cup', shortName: 'Peace Cup', slug: 'peace-cup', type: 'cup', primaryColor: '#D7A72D' },
    { name: 'Rwanda National Team', shortName: 'Amavubi', slug: 'amavubi', type: 'national', primaryColor: '#176B45' },
  ];
  for (const item of competitions) {
    const competition = await prisma.competition.upsert({ where: { slug: item.slug }, update: {}, create: item });
    if (item.type !== 'national') await prisma.season.upsert({ where: { competitionId_name: { competitionId: competition.id, name: seasonName } }, update: {}, create: { competitionId: competition.id, name: seasonName, isCurrent: true, startDate: new Date(`${seasonName.slice(0,4)}-08-01T00:00:00Z`) } });
  }
  console.log('RwandaScore base records are ready.');
  if (credentials.length) { console.log('Temporary credentials (shown once; change at first sign-in):'); for (const user of credentials) console.log(`${user.role} ${user.email} ${user.password}`); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
