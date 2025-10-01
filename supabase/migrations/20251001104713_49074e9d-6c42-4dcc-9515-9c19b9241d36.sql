-- Link Elad's property to his user account
INSERT INTO property_owners (property_id, owner_id, ownership_percentage)
VALUES ('a1ada563-47db-415f-8896-e1fcd9406658', 'bfd1625c-7bb5-424f-8969-966cbbdd00ef', 100)
ON CONFLICT (property_id, owner_id) DO NOTHING;