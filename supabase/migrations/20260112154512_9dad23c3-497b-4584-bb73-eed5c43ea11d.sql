-- Insert default scout configurations for Tel Aviv
-- Priority: Madlan > Yad2 Private > Homeless

-- Configuration 1: Madlan Tel Aviv - Rent
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('מדל"ן תל אביב - השכרה', 'madlan', 'rent', ARRAY['תל אביב'], true);

-- Configuration 2: Madlan Tel Aviv - Sale
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('מדל"ן תל אביב - מכירה', 'madlan', 'sale', ARRAY['תל אביב'], true);

-- Configuration 3: Yad2 Private Tel Aviv - Rent
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('יד2 פרטיים תל אביב - השכרה', 'yad2_private', 'rent', ARRAY['תל אביב'], true);

-- Configuration 4: Yad2 Private Tel Aviv - Sale
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('יד2 פרטיים תל אביב - מכירה', 'yad2_private', 'sale', ARRAY['תל אביב'], true);

-- Configuration 5: Homeless Tel Aviv - Rent
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('הומלס תל אביב - השכרה', 'homeless', 'rent', ARRAY['תל אביב'], true);

-- Configuration 6: Homeless Tel Aviv - Sale
INSERT INTO scout_configs (name, source, property_type, cities, is_active)
VALUES ('הומלס תל אביב - מכירה', 'homeless', 'sale', ARRAY['תל אביב'], true);