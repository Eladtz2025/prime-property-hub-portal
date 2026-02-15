-- Delete the old duplicate entry that conflicts with "Firecrawl" (same key, same priority)
DELETE FROM firecrawl_api_keys WHERE label = 'taylor.kelly88@gmail.com';
