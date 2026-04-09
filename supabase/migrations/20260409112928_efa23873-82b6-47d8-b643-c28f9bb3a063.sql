UPDATE property_images SET is_main = false
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY property_id ORDER BY order_index DESC
    ) as rn
    FROM property_images WHERE is_main = true
  ) sub WHERE rn > 1
);