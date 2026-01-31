-- Update all Homeless configs to 8 pages, 15s delay, keep only first schedule time
UPDATE scout_configs 
SET max_pages = 8, 
    page_delay_seconds = 15,
    schedule_times = ARRAY[schedule_times[1]]
WHERE source = 'homeless' 
  AND id != '94ceebc9-44d5-4d47-82c5-d00cb0c17d85';

-- Delete the old legacy config
DELETE FROM scout_configs WHERE id = '94ceebc9-44d5-4d47-82c5-d00cb0c17d85';

-- Insert missing Homeless configs (South + Jaffa)
INSERT INTO scout_configs (name, source, cities, neighborhoods, property_type, is_active, max_pages, page_delay_seconds, schedule_times)
VALUES 
  ('Homeless דרום - השכרה', 'homeless', '{"תל אביב יפו"}', '{"homeless_תא_דרום"}', 'rent', true, 8, 15, '{"19:10"}'),
  ('Homeless דרום - מכירה', 'homeless', '{"תל אביב יפו"}', '{"homeless_תא_דרום"}', 'sale', true, 8, 15, '{"19:15"}'),
  ('Homeless יפו - השכרה', 'homeless', '{"תל אביב יפו"}', '{"homeless_יפו"}', 'rent', true, 8, 15, '{"19:50"}'),
  ('Homeless יפו - מכירה', 'homeless', '{"תל אביב יפו"}', '{"homeless_יפו"}', 'sale', true, 8, 15, '{"19:55"}');

-- Insert 20 Yad2 configs
INSERT INTO scout_configs (name, source, cities, neighborhoods, property_type, is_active, max_pages, page_delay_seconds, wait_for_ms, schedule_times)
VALUES 
  ('Yad2 צפון ישן - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_צפון_ישן"}', 'rent', true, 8, 15, 5000, '{"08:00"}'),
  ('Yad2 צפון ישן - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_צפון_ישן"}', 'sale', true, 8, 15, 5000, '{"08:05"}'),
  ('Yad2 צפון חדש - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_צפון_חדש"}', 'rent', true, 8, 15, 5000, '{"08:10"}'),
  ('Yad2 צפון חדש - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_צפון_חדש"}', 'sale', true, 8, 15, 5000, '{"08:15"}'),
  ('Yad2 כיכר המדינה - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_כיכר_המדינה"}', 'rent', true, 8, 15, 5000, '{"08:20"}'),
  ('Yad2 כיכר המדינה - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_כיכר_המדינה"}', 'sale', true, 8, 15, 5000, '{"08:25"}'),
  ('Yad2 לב העיר - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_לב_העיר"}', 'rent', true, 8, 15, 5000, '{"08:30"}'),
  ('Yad2 לב העיר - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_לב_העיר"}', 'sale', true, 8, 15, 5000, '{"08:35"}'),
  ('Yad2 בבלי - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_בבלי"}', 'rent', true, 8, 15, 5000, '{"08:40"}'),
  ('Yad2 בבלי - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_בבלי"}', 'sale', true, 8, 15, 5000, '{"08:45"}'),
  ('Yad2 נווה צדק - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_נווה_צדק"}', 'rent', true, 8, 15, 5000, '{"08:50"}'),
  ('Yad2 נווה צדק - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_נווה_צדק"}', 'sale', true, 8, 15, 5000, '{"08:55"}'),
  ('Yad2 כרם התימנים - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_כרם_התימנים"}', 'rent', true, 8, 15, 5000, '{"09:00"}'),
  ('Yad2 כרם התימנים - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_כרם_התימנים"}', 'sale', true, 8, 15, 5000, '{"09:05"}'),
  ('Yad2 רמת אביב - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_רמת_אביב"}', 'rent', true, 8, 15, 5000, '{"09:10"}'),
  ('Yad2 רמת אביב - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_רמת_אביב"}', 'sale', true, 8, 15, 5000, '{"09:15"}'),
  ('Yad2 רוטשילד - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_רוטשילד"}', 'rent', true, 8, 15, 5000, '{"09:20"}'),
  ('Yad2 רוטשילד - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_רוטשילד"}', 'sale', true, 8, 15, 5000, '{"09:25"}'),
  ('Yad2 נמל תל אביב - השכרה', 'yad2', '{"תל אביב יפו"}', '{"yad2_נמל_תל_אביב"}', 'rent', true, 8, 15, 5000, '{"09:30"}'),
  ('Yad2 נמל תל אביב - מכירה', 'yad2', '{"תל אביב יפו"}', '{"yad2_נמל_תל_אביב"}', 'sale', true, 8, 15, 5000, '{"09:35"}');