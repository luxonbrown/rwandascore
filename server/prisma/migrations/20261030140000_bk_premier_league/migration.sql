UPDATE `competitions`
SET
  `name` = 'BK Premier League',
  `short_name` = 'BKPL',
  `description` = 'Rwanda\'s top-flight football competition, featuring the country\'s leading clubs.'
WHERE `slug` = 'rwanda-premier-league'
  AND `name` = 'Rwanda Premier League';
