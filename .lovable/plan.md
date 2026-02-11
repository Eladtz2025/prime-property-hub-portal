
# שדרוג דשבורד בדיקות זמינות - תצוגה מלאה

## מה יתווסף

### 1. פירוט ריצות (Run Details Dialog)
לחיצה על שורה בטבלת הריצות תפתח דיאלוג עם:
- רשימת כל הנכסים שנבדקו בריצה הזו עם התוצאה של כל אחד
- לינק לנכס המקורי
- Badge צבעוני לתוצאה (content_ok, listing_removed, timeout וכו')
- סיכום: כמה content_ok, כמה הוסרו, כמה timeout

**אתגר טכני**: טבלת `availability_check_runs` לא שומרת אילו נכסים נבדקו בכל ריצה. הפתרון: להוסיף שדה `checked_property_ids` (uuid[]) או `run_details` (jsonb) לטבלה, ולעדכן אותו ב-Edge Function בסיום כל ריצה.

### 2. סטטיסטיקות מורחבות (Breakdown by Reason)
בנוסף ל-4 הכרטיסים הנוכחיים, להוסיף:
- **גרף Pie/Bar** של חלוקת התוצאות (content_ok vs listing_removed vs timeout vs no_indicators)
- **Breakdown מלא**: כרטיס שמציג את כל הסטטוסים עם כמויות (כולל no_indicators_keeping_active שיש 1,051 כאלה)
- **סטטיסטיקה לפי מקור**: כמה Yad2 / Madlan / Homeless מכל סטטוס

### 3. לוגים בזמן אמת (Live Logs)
סקשן חדש שמציג לוגים מתוך Edge Function:
- שימוש ב-`supabase--edge-function-logs` API (או Supabase realtime) להצגת הלוגים האחרונים
- סינון לפי רמה (info/warn/error)
- כפתור רענון ידני
- הצגת הודעות כמו "HEAD 404 for url", "Removal indicator found", "Property data wins" וכו'

### 4. טיימליין יומי (Daily Timeline)
תצוגה ויזואלית של מתי רצו בדיקות במהלך היום:
- ציר זמן אופקי (0:00-23:59)
- נקודות/בלוקים צבעוניים לכל ריצה
- ירוק = הושלם, כחול = רץ, אדום = נכשל
- Hover מציג פרטים

### 5. הגדרות עריכה (Editable Settings)
במקום רק תצוגת ההגדרות, להוסיף:
- כפתור עריכה ליד כל הגדרה
- Input לעריכה עם שמירה ב-DB
- כפתור "איפוס לברירת מחדל"
- שימוש ב-`useUpdateScoutSetting` הקיים

### 6. כפתורי פעולה מהירה
- **"בדוק את כל ה-Pending"** - שולח את כל הנכסים ללא בדיקה לבדיקה
- **"אפס Timeouts"** - מאפס את availability_checked_at לכל נכסי ה-timeout
- **"הפעל ריצה עכשיו"** - קורא ל-trigger-availability-check
- **"בדוק URL ספציפי"** - Input לכתובת URL + כפתור בדיקה

### 7. טבלת תוצאות משופרת
- עמוד (Pagination) - במקום limit 100, להוסיף עמודים
- עמודות נוספות: מחיר, חדרים, שכונה
- סינון לפי מקור (Yad2/Madlan/Homeless)
- חיפוש חופשי לפי כתובת/עיר
- סימון נכסים "חשודים" (no_indicators) בצבע צהוב

## פירוט טכני

### קבצים חדשים
1. `src/components/scout/availability/AvailabilityStats.tsx` - כרטיסי סטטיסטיקה + breakdown
2. `src/components/scout/availability/AvailabilityRunDetails.tsx` - דיאלוג פרטי ריצה
3. `src/components/scout/availability/AvailabilityTimeline.tsx` - ציר זמן יומי
4. `src/components/scout/availability/AvailabilityActions.tsx` - כפתורי פעולה מהירה
5. `src/components/scout/availability/AvailabilityLogs.tsx` - תצוגת לוגים

### קבצים לעדכון
1. `src/components/scout/AvailabilityCheckDashboard.tsx` - שילוב כל התת-קומפוננטות, הוספת pagination וסינון
2. `supabase/functions/trigger-availability-check/index.ts` - שמירת רשימת הנכסים שנבדקו (checked_property_ids)
3. `supabase/functions/check-property-availability/index.ts` - החזרת תוצאות מפורטות יותר

### מיגרציה
הוספת עמודות לטבלת `availability_check_runs`:
```sql
ALTER TABLE availability_check_runs 
ADD COLUMN IF NOT EXISTS run_details jsonb DEFAULT '[]'::jsonb;
```
ה-`run_details` ישמור מערך של `{ property_id, source_url, reason, is_inactive }` לכל נכס שנבדק בריצה.

### שאילתות חדשות
- Breakdown לפי reason ומקור:
```sql
SELECT source, availability_check_reason, COUNT(*) 
FROM scouted_properties 
WHERE availability_check_reason IS NOT NULL 
GROUP BY source, availability_check_reason;
```
- נכסים חשודים (no_indicators):
```sql
SELECT * FROM scouted_properties 
WHERE availability_check_reason = 'no_indicators_keeping_active' 
AND is_active = true;
```

### דפוסי עיצוב
- שימוש ב-Recharts (כבר מותקן) לגרפים
- Collapsible sections כמו שכבר קיים
- Dialog לפירוט ריצות (כמו ScoutRunHistory)
- RTL + Hebrew labels
- refetchInterval לעדכון אוטומטי
