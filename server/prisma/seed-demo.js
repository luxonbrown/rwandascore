import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const competition = await prisma.competition.findUnique({ where: { slug: 'rwanda-premier-league' } });
  if (!competition) throw new Error('Run npm run seed before npm run seed:demo.');
  const season = await prisma.season.findFirst({ where: { competitionId: competition.id, isCurrent: true } });
  if (!season) throw new Error('Current RPL season missing; run npm run seed.');
  const stadium = await prisma.stadium.upsert({ where: { name_city: { name: 'Amahoro Stadium', city: 'Kigali' } }, update: {}, create: { name: 'Amahoro Stadium', city: 'Kigali', capacity: 45000 } });
  const apr = await prisma.team.upsert({ where: { slug: 'apr-fc' }, update: {}, create: { name: 'APR FC', shortName: 'APR', initials: 'APR', slug: 'apr-fc', city: 'Kigali', stadiumId: stadium.id, primaryColor: '#176B45' } });
  const rayon = await prisma.team.upsert({ where: { slug: 'rayon-sports' }, update: {}, create: { name: 'Rayon Sports', shortName: 'Rayon', initials: 'RAY', slug: 'rayon-sports', city: 'Nyanza', primaryColor: '#2876C7' } });
  console.log(`Demo records ready: ${apr.name}, ${rayon.name}, ${stadium.name}. Add demo matches from the admin panel when desired.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
