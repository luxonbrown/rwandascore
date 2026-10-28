import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const now = new Date();
const seasonStartYear = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
const seasonName = `${seasonStartYear}/${String(seasonStartYear + 1).slice(-2)}`;

const competitions = [
  { name: 'Rwanda Premier League', shortName: 'RPL', slug: 'rwanda-premier-league', type: 'league', primaryColor: '#176B45' },
  { name: 'Rwanda Peace Cup', shortName: 'Peace Cup', slug: 'peace-cup', type: 'cup', primaryColor: '#D7A72D' },
  { name: 'Rwanda National Team', shortName: 'Amavubi', slug: 'amavubi', type: 'national', primaryColor: '#176B45' },
];

async function main() {
  for (const data of competitions) {
    const competition = await prisma.competition.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    await prisma.season.upsert({
      where: { competitionId_name: { competitionId: competition.id, name: seasonName } },
      update: { isCurrent: true },
      create: {
        competitionId: competition.id,
        name: seasonName,
        isCurrent: true,
        startDate: new Date(`${seasonStartYear}-08-01T00:00:00.000Z`),
        endDate: new Date(`${seasonStartYear + 1}-05-31T23:59:59.999Z`),
      },
    });
  }
  console.log(`Rwanda competitions and ${seasonName} seasons are ready; no teams, matches, or news were added.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
