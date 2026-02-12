

# שינוי לוגיקת כפילויות וזמינות

## 1. כפילויות — הוספת מעקב "נבדק/לא נבדק"

### הבעיה הנוכחית
בדיקת הכפילויות רצה על כל הנכסים בכל פעם מחדש — אין סימון של "כבר נבדק".

### הפתרון
בדיוק כמו שעשינו ב-backfill — נוסיף עמודת `dedup_checked_at` לטבלת `scouted_properties`:
- `NULL` = טרם נבדק, צריך לעבור עליו
- תאריך = נבדק, ה-RPC יטפל רק בנכסים חדשים

### איך זה עובד:
1. **ריצה ראשונה**: עובר על כל הנכסים שעדיין `dedup_checked_at IS NULL` — בbatch-ים
2. **אחרי בדיקה**: כל נכס שנבדק מסומן עם `dedup_checked_at = now()`
3. **ריצות הבאות**: רק נכסים חדשים (NULL) ייבדקו
4. **נכס שהתעדכן** (כתובת השתנתה, מחיר השתנה): אפשר לאפס `dedup_checked_at = NULL` כדי שייבדק שוב

### מטריקה בדשבורד:
- "נותרו" = ספירת נכסים עם `dedup_checked_at IS NULL AND is_active = true`

---

## 2. זמינות — לוגיקת recheck חכמה

### הבעיה הנוכחית
כל הנכסים נבדקים מחדש כל 7 ימים — אותו קצב לכולם.

### הפתרון
מעבר ללוגיקת recheck דו-שלבית:
- **בדיקה ראשונה**: כל נכס שמעולם לא נבדק (`availability_checked_at IS NULL`) — עדיפות עליונה
- **Recheck ראשון**: 8 ימים אחרי הבדיקה הראשונה
- **Recheck חוזר**: כל 2 ימים אחרי ה-recheck הראשון

### איך ניישם:
נוסיף עמודת `availability_check_count` (integer, default 0) לספירת כמה פעמים הנכס נבדק:
- `check_count = 0` ו-`checked_at IS NULL` = מעולם לא נבדק → עדיפות ראשונה
- `check_count = 1` = נבדק פעם אחת → recheck אחרי 8 ימים
- `check_count >= 2` = נבדק יותר מפעם → recheck כל 2 ימים

שאילתת השליפה ב-`trigger-availability-check` תשתנה:
```text
WHERE is_active = true
AND (
  availability_checked_at IS NULL                              -- מעולם לא נבדק
  OR (check_count = 1 AND checked_at < now() - 8 days)        -- recheck ראשון
  OR (check_count >= 2 AND checked_at < now() - 2 days)        -- rechecks חוזרים
)
ORDER BY availability_checked_at ASC NULLS FIRST
```

כל בדיקה מוצלחת מעדכנת: `availability_checked_at = now()` וגם `availability_check_count = check_count + 1`.

### הגדרות:
נוסיף 2 הגדרות חדשות ב-`scout_settings` (קטגוריית availability):
- `first_recheck_interval_days` = 8
- `recurring_recheck_interval_days` = 2

כך שאפשר לשנות מהדשבורד בלי לגעת בקוד.

---

## פרטים טכניים

### מיגרציה (שלב 1)
- הוספת עמודת `dedup_checked_at` (timestamptz, nullable) ל-`scouted_properties`
- הוספת עמודת `availability_check_count` (integer, default 0) ל-`scouted_properties`
- אינדקס על `dedup_checked_at` עם `WHERE is_active = true`
- סימון נכסים שכבר נבדקו בזמינות: `UPDATE SET availability_check_count = 1 WHERE availability_checked_at IS NOT NULL`
- הוספת הגדרות חדשות ל-scout_settings

### שינוי Edge Function: `trigger-availability-check/index.ts` (שלב 2)
- שליפת הגדרות `first_recheck_interval_days` ו-`recurring_recheck_interval_days`
- שינוי שאילתת השליפה ל-3 תנאים (NULL / count=1+8days / count>=2+2days)
- לא ניתן לעשות OR מורכב עם supabase-js — נשתמש ב-RPC או view

### שינוי Edge Function: `check-property-availability/index.ts` (שלב 3)
- בכל בדיקה מוצלחת (לא retryable): הוספת `availability_check_count` increment

### שינוי: `ChecksDashboard.tsx` (שלב 4)
- עדכון מטריקת "נותרו" של כפילויות לספירת `dedup_checked_at IS NULL`
- עדכון תיאור הלוגיקה של זמינות (8 ימים ראשונים, אח"כ כל 2 ימים)
- עדכון תיאור הלוגיקה של כפילויות (ריצה ראשונה על הכל, אח"כ רק חדשים)

### Deploy:
- trigger-availability-check
- check-property-availability

### קבצים שישתנו:
- מיגרציה חדשה
- `supabase/functions/trigger-availability-check/index.ts`
- `supabase/functions/check-property-availability/index.ts`
- `src/components/scout/ChecksDashboard.tsx`
- `src/integrations/supabase/types.ts`
