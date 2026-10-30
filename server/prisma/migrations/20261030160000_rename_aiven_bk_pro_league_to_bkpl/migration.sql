-- Preserve the existing Aiven competition ID, seasons, and matches while
-- aligning the stored BK Pro League identity with the app's BK Premier League.
UPDATE `competitions`
SET
  `name` = 'BK Premier League',
  `short_name` = 'BKPL',
  `slug` = 'rwanda-premier-league',
  `type` = 'league',
  `description` = 'Rwanda\'s top-flight football competition, featuring the country\'s leading clubs.'
WHERE `slug` = 'bk-pro-league'
  AND TRIM(`name`) = 'BK PRO LEAGUE'
  AND `type` = 'league';
