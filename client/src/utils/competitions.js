export function findPremierLeague(competitions = []) {
  return competitions.find((competition) => competition.slug === 'rwanda-premier-league')
    || competitions.find((competition) => String(competition.type || '').toLowerCase() === 'league'
      && /bk.*premier|rwanda.*premier|premier.*league/i.test(`${competition.name || ''} ${competition.shortName || ''}`))
    || null
}
