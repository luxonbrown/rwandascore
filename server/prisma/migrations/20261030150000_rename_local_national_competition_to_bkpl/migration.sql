-- The local database's only league record was still stored under the old
-- generic "National" identity. Keep its ID and related seasons/matches while
-- giving the existing competition the BK Premier League identity expected by
-- the application.
UPDATE `competitions`
SET
  `name` = 'BK Premier League',
  `short_name` = 'BKPL',
  `slug` = 'rwanda-premier-league',
  `type` = 'league',
  `description` = 'Rwanda\'s top-flight football competition, featuring the country\'s leading clubs.'
WHERE `slug` = 'national'
  AND `name` = 'National';
