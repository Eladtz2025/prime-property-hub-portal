-- תיקון 1: ריצות matching - new_properties צריך להיות 0 (לא רלוונטי)
UPDATE scout_runs 
SET new_properties = 0
WHERE source = 'matching';

-- תיקון 2: ריצות עם ערכים לא הגיוניים (new > 100)
UPDATE scout_runs 
SET new_properties = LEAST(new_properties, 50)
WHERE source != 'matching' 
AND new_properties > 100;

-- תיקון 3: properties_found לא סביר (מעל 200 לריצה בודדת)
UPDATE scout_runs 
SET properties_found = LEAST(properties_found, 200)
WHERE source != 'matching' 
AND properties_found > 200;