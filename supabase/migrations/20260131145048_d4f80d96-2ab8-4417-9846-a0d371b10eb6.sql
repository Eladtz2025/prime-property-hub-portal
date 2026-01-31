-- Deactivate additional non-Tel Aviv properties that were missed
-- This handles: Even Yehuda (city), Netanya, moshavim, kibbutzim, and more

UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
AND (
  -- אבן יהודה (העיר, לא הרחוב)
  address ILIKE '%, אבן יהודה%'
  OR address ILIKE '%אבן יהודה, אבן יהודה%'
  -- נתניה
  OR address ILIKE '%Netanya%'
  OR address ILIKE '%נתניה%'
  OR address ILIKE '%קרית נורדאו%'
  OR title ILIKE '%קרית נורדאו%'
  -- מושבים וקיבוצים שאינם בתל אביב
  OR address ILIKE '%מושב כפר דניאל%'
  OR address ILIKE '%קיבוץ מחניים%'
  OR address ILIKE '%רמות נפתלי%'
  -- קרית מלאכי וערים נוספות
  OR address ILIKE '%קרית מלאכי%'
  OR title ILIKE '%קרית מלאכי%'
  OR address ILIKE '%קרית גת%'
  OR title ILIKE '%קרית גת%'
  OR address ILIKE '%קרית שמונה%'
  OR title ILIKE '%קרית שמונה%'
  -- English city names
  OR address ILIKE '%Herzliya%'
  OR address ILIKE '%Ramat Gan%'
  OR address ILIKE '%Givatayim%'
  OR address ILIKE '%Petah Tikva%'
  OR address ILIKE '%Petach Tikva%'
  OR address ILIKE '%Holon%'
  OR address ILIKE '%Bat Yam%'
);