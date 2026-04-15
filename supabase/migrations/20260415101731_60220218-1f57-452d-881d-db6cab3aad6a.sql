
-- Transfer appointments to Elad
UPDATE appointments SET assigned_to = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' WHERE assigned_to = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';
UPDATE appointments SET created_by = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' WHERE created_by = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Delete activity logs
DELETE FROM activity_logs WHERE user_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Delete notifications
DELETE FROM notifications WHERE recipient_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Transfer business expenses to Elad
UPDATE business_expenses_list SET assigned_to = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' WHERE assigned_to = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';
UPDATE business_expenses_list SET created_by = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' WHERE created_by = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Transfer development ideas to Elad
UPDATE development_ideas SET created_by = 'bfd1625c-7bb5-424f-8969-966cbbdd00ef' WHERE created_by = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Remove property ownership
DELETE FROM property_owners WHERE owner_id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';

-- Delete profile
DELETE FROM profiles WHERE id = '30300ca7-6c59-41e4-99dd-ef59ea3ea349';
