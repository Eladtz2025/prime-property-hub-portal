
-- Clean dirty Madlan addresses in scouted_properties
-- 1. Remove trailing HTML fragments like "<div", "<span", ".css-..."
-- 2. Remove "דירה, " / "דירת גן, " / "פנטהאוז, " prefix
-- 3. Remove HTML entities like &#x27;

-- Step 1: Remove trailing broken HTML (e.g., "<div", "<span", ".css-ekbcqa{...")
UPDATE scouted_properties
SET address = regexp_replace(address, '\s*<[^>]*$', '', 'g')
WHERE address ~ '\s*<[^>]*$';

-- Step 2: Remove trailing CSS fragments
UPDATE scouted_properties
SET address = regexp_replace(address, '\s*\.css-[^\s]*.*$', '', 'g')
WHERE address ~ '\.css-';

-- Step 3: Remove property type prefix ("דירה, ", "דירת גן, ", "פנטהאוז, ", etc.)
UPDATE scouted_properties
SET address = regexp_replace(address, '^\s*(דירה|דירת\s*גן|פנטהאוז|דירת\s*גג|סטודיו|מיני\s*פנטהאוז|דופלקס|טריפלקס|קוטג''|בית\s*פרטי|יחידת\s*דיור)\s*,\s*', '', 'i')
WHERE address ~ '^\s*(דירה|דירת\s*גן|פנטהאוז|דירת\s*גג|סטודיו|מיני\s*פנטהאוז|דופלקס|טריפלקס|קוטג|בית\s*פרטי|יחידת\s*דיור)\s*,';

-- Step 4: Clean HTML entities
UPDATE scouted_properties
SET address = replace(address, '&#x27;', '''')
WHERE address LIKE '%&#x27;%';

-- Step 5: Trim whitespace
UPDATE scouted_properties
SET address = trim(address)
WHERE address != trim(address);
