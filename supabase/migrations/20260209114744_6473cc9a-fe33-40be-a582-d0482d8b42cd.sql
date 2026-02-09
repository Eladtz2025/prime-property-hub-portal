ALTER TABLE properties DROP CONSTRAINT properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type = ANY (ARRAY['rental', 'sale', 'management', 'project']));