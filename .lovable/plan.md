

# תיקון בעיות התאמות לקוחות

## סיכום הבעיות שנמצאו

| בעיה | כמות | חומרה |
|---|---|---|
| נכסים לא אקטיביים עם התאמות שאריתיות | 23 | נמוכה |
| כפילויות (non-primary) עם התאמות | 127 | בינונית |
| נכסים פעילים ללא התאמות כלל | 4,179 | גבוהה |
| לקוח עם נתוני ערים שגויים (Ofir) | 1 | בינונית |
| אין trigger לניקוי התאמות בשינוי מחיר | - | גבוהה |

## שינויים מתוכננים

### 1. ניקוי נתונים מיידי (SQL)

**א. ניקוי matched_leads מנכסים לא אקטיביים (23):**
```sql
UPDATE scouted_properties SET matched_leads = '[]'::jsonb
WHERE is_active = false AND matched_leads IS NOT NULL 
  AND jsonb_array_length(matched_leads) > 0;
```

**ב. ניקוי matched_leads מכפילויות non-primary (127):**
```sql
UPDATE scouted_properties SET matched_leads = '[]'::jsonb
WHERE is_primary_listing = false AND duplicate_group_id IS NOT NULL 
  AND matched_leads IS NOT NULL AND jsonb_array_length(matched_leads) > 0;
```

**ג. תיקון נתוני ערים של Ofir:**
```sql
UPDATE contact_leads 
SET preferred_cities = ARRAY['תל אביב יפו']
WHERE id = 'e988ffb1-4a98-42c4-bb5f-a55ef090b3f8';
```

### 2. Trigger חדש: ניקוי התאמות בשינוי מחיר משמעותי (Migration)

כשמחיר נכס משתנה ביותר מ-20%, ה-matched_leads הופכים ללא רלוונטיים כי חלק מהלידים כבר לא עומדים בטווח התקציב. הפתרון: trigger שמנקה את matched_leads ומחזיר את הסטטוס ל-new כדי שהנכס ייכנס מחדש לריצת ההתאמות הבאה.

```sql
CREATE OR REPLACE FUNCTION clean_matches_on_price_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.price IS NOT NULL AND NEW.price IS NOT NULL 
     AND OLD.price > 0 AND NEW.price > 0
     AND ABS(NEW.price - OLD.price)::float / OLD.price > 0.20 THEN
    NEW.matched_leads = '[]'::jsonb;
    NEW.status = 'new';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clean_matches_on_price_change
BEFORE UPDATE ON scouted_properties
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION clean_matches_on_price_change();
```

### 3. הרצת re-matching מלא

אחרי כל הניקויים, נפעיל ריצת התאמות מלאה (`trigger-matching` עם `force: true`) כדי שכל 4,179 הנכסים שכרגע ללא התאמות יקבלו התאמות מעודכנות ומדויקות.

---

## סדר ביצוע

1. ניקוי נתוני Ofir (SQL insert tool)
2. ניקוי matched_leads מנכסים לא אקטיביים וכפילויות (SQL insert tool)
3. יצירת trigger לשינוי מחיר (migration)
4. הפעלת re-matching מלא (edge function call)
5. בדיקת תוצאות

