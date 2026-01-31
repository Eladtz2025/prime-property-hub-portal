-- Deactivate non-Tel Aviv properties with blacklisted locations in title or address
-- This is a one-time cleanup based on identified problematic locations

UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
AND (
  -- Neve Kfir (Petah Tikva)
  title ILIKE '%נווה כפיר%' OR address ILIKE '%נווה כפיר%'
  -- Yavneel (Northern Israel city, NOT Tel Aviv)
  OR title ILIKE '%יבנאל%' OR address ILIKE '%יבנאל%'
  -- Tzofim (Settlement)
  OR title ILIKE '%צופים%' OR address ILIKE '%צופים%'
  -- Caesarea
  OR title ILIKE '%קיסריה%' OR address ILIKE '%קיסריה%'
  -- Ma'ale Adumim
  OR title ILIKE '%מעלה אדומים%' OR address ILIKE '%מעלה אדומים%'
  -- Tzmach HaSadeh (Ma'ale Adumim)
  OR title ILIKE '%צמח השדה%' OR address ILIKE '%צמח השדה%'
  -- Smadar Ilit (Yavneel)
  OR title ILIKE '%סמדר עילית%' OR address ILIKE '%סמדר עילית%'
  -- Rishon LeZion (English)
  OR title ILIKE '%rishon%' OR address ILIKE '%rishon%'
  -- Rishon LeZion (Hebrew)
  OR title ILIKE '%ראשון לציון%' OR address ILIKE '%ראשון לציון%'
);