## תוכנית: סימון אוטומטי ל-backfill כשנכס נדחה בגלל features חסרים + ניקוי תג מטעה

### מצב נוכחי (אומת מול ה-DB)
- 1,837 נכסים עם `availability_check_reason = 'needs_enrichment'` — תג טקסטואלי בלבד, לא משפיע על תור בדיקת הזמינות
- אותם 1,837 כבר מסומנים `backfill_status = 'pending'` (התיקון הקודם עבד) — backfill אמור לעבוד עליהם
- אין שום הצפה אמיתית של בודק הזמינות

### למה צריך תיקון
1. **מניעה עתידית:** היום, כשהמטצ'ר דוחה נכס בגלל feature חסר, הוא רק מתייג את הנכס בעמודה לא-מתאימה. אין דחיפה אוטומטית ל-backfill. בעוד חודש-חודשיים נחזור ל"אלפי נכסים תקועים".
2. **בלבול תפעולי:** התג `needs_enrichment` בעמודת availability גורם להתבלבל (כמו שראינו בשיחה הזו).

---

### שלב 1: עדכון לוגיקת המטצ'ר (`supabase/functions/_shared/matching.ts`)

בכל מקום שבו המטצ'ר מחזיר `matchScore: 0` בגלל feature חסר (שורות 425, 435, 473, 479, 488, 497, 514, 519) — לסמן את הנכס ל-backfill.

**מימוש:**
- להוסיף import של `createClient` ו-service role key (כבר קיים בקובץ).
- ליצור פונקציית עזר `markScoutedForBackfill(supabase, propertyId)` שמריצה:
  ```sql
  UPDATE scouted_properties 
  SET backfill_status = 'pending', backfill_attempted_at = NULL
  WHERE id = $1 AND backfill_status != 'pending'
  ```
- לקרוא לה מהפונקציה הראשית `matchProperty` כשהדחייה היא בגלל feature חסר (parking/elevator/balcony/yard/roof/mamad/furnished שהליד דורש strict).
- להעביר את ה-supabase client + property.id כפרמטרים לפונקציית `matchProperty` (כבר זמינים ב-callers הקיימים: `trigger-matching`, `match-batch`).
- **הגנה:** לסמן רק עבור `scouted_properties` (לא עבור `properties` הפנימיים — אין להם backfill). הזיהוי: ה-caller כבר יודע אם זה scouted או own; נוסיף פרמטר `source: 'scouted' | 'own'` ל-`matchProperty` (default 'scouted').

### שלב 2: ניקוי התג המטעה (data update)

הרצת UPDATE על 1,837 הנכסים:
```sql
UPDATE scouted_properties
SET availability_check_reason = NULL
WHERE is_active = true 
  AND availability_check_reason = 'needs_enrichment';
```

זה לא נוגע ב-`backfill_status` (נשאר pending — הם בתור backfill כרגיל), לא נוגע ב-`availability_checked_at`, רק מנקה תג טקסטואלי.

### שלב 3: וידוא לאחר ביצוע
- `SELECT COUNT(*) WHERE availability_check_reason = 'needs_enrichment'` → 0
- `SELECT COUNT(*) WHERE backfill_status = 'pending'` → ~1,837 (לא משתנה)
- backfill cron הבא (00:00) יעבוד עליהם כרגיל

### סיכון
- שלב 1: שינוי לוגיקה קטן + UPDATE אסינכרוני אחד לכל דחיית features. אם ה-UPDATE נכשל — לא חוסם את המטצ'ר (try/catch).
- שלב 2: data-only, ניתן לחזרה בשאילתה אחת.

מאשר ביצוע?