-- Insert 14 new Madlan configurations for Tel Aviv neighborhoods
INSERT INTO scout_configs (name, source, property_type, cities, neighborhoods, max_pages, page_delay_seconds, wait_for_ms, schedule_times, is_active)
VALUES
('מדל"ן צפון ישן - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_צפון_ישן_צפוני', 'madlan_צפון_ישן_מרכזי', 'madlan_צפון_ישן_דרום_מזרחי', 'madlan_צפון_ישן_דרום_מערבי'], 8, 5, 8000, ARRAY['12:00'], true),
('מדל"ן צפון ישן - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_צפון_ישן_צפוני', 'madlan_צפון_ישן_מרכזי', 'madlan_צפון_ישן_דרום_מזרחי', 'madlan_צפון_ישן_דרום_מערבי'], 8, 5, 8000, ARRAY['12:05'], true),
('מדל"ן צפון חדש - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_צפון_חדש_צפוני', 'madlan_צפון_חדש_דרומי', 'madlan_כיכר_המדינה'], 8, 5, 8000, ARRAY['12:10'], true),
('מדל"ן צפון חדש - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_צפון_חדש_צפוני', 'madlan_צפון_חדש_דרומי', 'madlan_כיכר_המדינה'], 8, 5, 8000, ARRAY['12:15'], true),
('מדל"ן לב תל אביב - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_לב_תל_אביב'], 8, 5, 8000, ARRAY['12:20'], true),
('מדל"ן לב תל אביב - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_לב_תל_אביב'], 8, 5, 8000, ARRAY['12:25'], true),
('מדל"ן בבלי + נמל - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_בבלי', 'madlan_נמל_תל_אביב'], 8, 5, 8000, ARRAY['12:30'], true),
('מדל"ן בבלי + נמל - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_בבלי', 'madlan_נמל_תל_אביב'], 8, 5, 8000, ARRAY['12:35'], true),
('מדל"ן נווה צדק + כרם התימנים - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_נווה_צדק', 'madlan_כרם_התימנים'], 8, 5, 8000, ARRAY['12:40'], true),
('מדל"ן נווה צדק + כרם התימנים - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_נווה_צדק', 'madlan_כרם_התימנים'], 8, 5, 8000, ARRAY['12:45'], true),
('מדל"ן רמת אביב + תל ברוך - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_רמת_אביב', 'madlan_רמת_אביב_החדשה', 'madlan_תל_ברוך', 'madlan_תל_ברוך_צפון'], 8, 5, 8000, ARRAY['12:50'], true),
('מדל"ן רמת אביב + תל ברוך - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_רמת_אביב', 'madlan_רמת_אביב_החדשה', 'madlan_תל_ברוך', 'madlan_תל_ברוך_צפון'], 8, 5, 8000, ARRAY['12:55'], true),
('מדל"ן פלורנטין + דרום - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], ARRAY['madlan_פלורנטין', 'madlan_דרום_העיר'], 8, 5, 8000, ARRAY['13:00'], true),
('מדל"ן פלורנטין + דרום - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], ARRAY['madlan_פלורנטין', 'madlan_דרום_העיר'], 8, 5, 8000, ARRAY['13:05'], true);