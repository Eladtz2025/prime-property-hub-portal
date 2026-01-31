-- Insert new Yad2 multi-neighborhood configuration for Tel Aviv North+Center areas
INSERT INTO scout_configs (
  name,
  source,
  property_type,
  cities,
  neighborhoods,
  max_pages,
  page_delay_seconds,
  is_active
) VALUES (
  'יד2 השכרה - צפון+מרכז תל אביב',
  'yad2',
  'rent',
  ARRAY['תל אביב'],
  ARRAY['צפון_ישן', 'צפון_חדש', 'מרכז_העיר', 'בבלי', 'כיכר_המדינה'],
  5,
  3,
  true
);