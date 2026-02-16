
## תיקון שריפת קרדיטים של Firecrawl + אופטימיזציות

### הבעיות שנמצאו

#### בעיה 1: לולאה אינסופית של בדיקות חוזרות (הבעיה העיקרית!)
**1,075 ריצות היום עם 19,338 קריאות API אבל רק 154 נכסים באמת נבדקו!**

הסיבה: כשנכס מקבל תוצאה retryable (כמו `rate_limited`, `all_keys_exhausted`, `per_property_timeout`) - המערכת **לא מעדכנת** את `availability_checked_at`. הנכס נשאר בתור ונבדק שוב ושוב בכל ריצה, ושורף קרדיטים בכל פעם.

- 18 נכסים עם `rate_limited` ו-5 עם `per_property_timeout` → נשארים בתור לנצח
- כל ריצה שולחת 18 נכסים (batch_size=6 * 3 batches) ← רובם אותם נכסים!

#### בעיה 2: בדיקת זמינות על כפילויות (216 קרדיטים מיותרים)
ה-RPC `get_properties_needing_availability_check` **לא מסנן** duplicate losers. מתוך 2,976 נכסים בתור, 216 הם כפילויות "מפסידות" שלא מוצגות כלל ללקוח. כל אחת שורפת קרדיט Firecrawl לחינם.

#### בעיה 3: שני תהליכי Firecrawl נפרדים (סריקה + השלמת נתונים)
כרגע: הסריקה הראשונית (scout) סורקת דף רשימה ומחלצת נתונים חלקיים (כתובת, מחיר, חדרים, גודל, קומה). אחר כך השלמת הנתונים (backfill) סורקת כל דף מודעה בנפרד כדי להוסיף: features (מעלית, חניה, מרפסת), מספר בית, סיווג מתווך/פרטי, תאריך כניסה.

4,133 נכסים עדיין מחכים להשלמת נתונים = 4,133 קריאות Firecrawl נוספות.

---

### הפתרון המוצע

#### תיקון 1: עדכון `availability_checked_at` גם לתוצאות retryable (קריטי!)
**קובץ:** `supabase/functions/check-property-availability/index.ts`

כשנכס מקבל תוצאה retryable, לעדכן את `availability_checked_at` כדי שהוא לא ייבדק שוב מיד. הוא ייכנס שוב לתור רק אחרי 2 ימים (recurring recheck interval).

שינוי בבלוק ה-retryable (שורות 348-359): במקום לעדכן רק `availability_check_reason`, לעדכן גם `availability_checked_at` ו-`availability_check_count`.

#### תיקון 2: סינון duplicate losers מהתור
**קובץ:** פונקציית RPC `get_properties_needing_availability_check`

הוספת תנאי: `AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)`. זה יחסוך ~216 קרדיטים מיותרים בכל מחזור.

#### תיקון 3: איחוד סריקה + השלמת נתונים (חיסכון ענק!)
**הרעיון:** במקום שהסריקה הראשונית תחלץ רק מהדף הראשי ואז backfill יסרוק כל מודעה בנפרד — לסרוק את כל הנתונים בפעם הראשונה.

**אבל**: זה שינוי מורכב מאוד. הסריקה הנוכחית סורקת **דפי רשימה** (listing pages) — כל דף מכיל 20-40 מודעות. ה-backfill סורק כל **דף מודעה בודדת** (detail page) בנפרד. לאחד את שניהם אומר: עבור כל נכס חדש שמצאנו, לסרוק גם את דף הפרטים שלו מייד — אבל זה יאט את הסריקה ויכול לגרום ל-timeout (מגבלת 60 שניות).

**הצעה ריאליסטית**: לא לאחד לגמרי, אלא לשפר את ה-backfill:
- להפעיל backfill מיד אחרי הסריקה (כבר קורה עם `auto_trigger`)
- לוודא שה-backfill לא סורק נכסים שכבר סומנו כ-`not_needed` או `completed`
- אם ב-Yad2 הפרסר מצליח לחלץ את כל הנתונים כבר מדף הרשימה — לסמן `backfill_status = 'not_needed'` מיד

---

### פירוט טכני

**1. `check-property-availability/index.ts` — שורות 348-359:**
```text
// Before (current): retryable items only update reason, NOT checked_at
// After: also update availability_checked_at and count
if (isRetryable) {
  errorCount++;
  const { data: curProp } = await supabase
    .from('scouted_properties')
    .select('availability_check_count')
    .eq('id', result.id)
    .single();
  
  await supabase
    .from('scouted_properties')
    .update({ 
      availability_check_reason: result.reason,
      availability_checked_at: new Date().toISOString(),
      availability_check_count: (curProp?.availability_check_count ?? 0) + 1,
    })
    .eq('id', result.id);
  continue;
}
```

**2. Migration SQL — עדכון RPC:**
```sql
CREATE OR REPLACE FUNCTION get_properties_needing_availability_check(...)
  -- Add filter: skip duplicate losers
  AND (sp.duplicate_group_id IS NULL OR sp.is_primary_listing = true)
```

**3. Scout parsers — סימון `backfill_status` מוקדם:**
ב-`saveProperty` (property-helpers.ts), אם כל השדות הקריטיים מלאים (rooms, price, size, floor, neighborhood, features) — לסמן `backfill_status = 'not_needed'` מיד, כדי לחסוך את קריאת ה-Firecrawl של ה-backfill.

### סיכום חיסכון צפוי

| אופטימיזציה | חיסכון |
|---|---|
| תיקון הלולאה האינסופית | ~19,000 קריאות מיותרות/יום |
| סינון duplicate losers | ~216 קריאות לכל מחזור |
| סימון backfill מוקדם | תלוי כמה נכסים מגיעים עם נתונים מלאים |
