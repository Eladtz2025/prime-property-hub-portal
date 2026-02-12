
# תיקון מערכת הכפילויות — Edge Function חדשה, סטטיסטיקות נכונות, ותמיכה בנכסים לא-אקטיביים

## מה לא עובד עכשיו

1. **אין Edge Function לכפילויות** — כפתור "הרצה" קורא ל-`detect-duplicates` שלא קיים, אז לא קורה כלום
2. **הסטטיסטיקות קוראות מטבלה ריקה** — `duplicate_alerts` מכילה 0 שורות. הנתונים האמיתיים נמצאים ב-`scouted_properties` (385 קבוצות, 587 נכסים בקבוצות)
3. **ה-RPC הקיים (`detect_duplicates_batch`) לא משתמש ב-`dedup_checked_at`** — הוא מסנן לפי `duplicate_group_id IS NULL`, אז נכס שנבדק ולא נמצאה לו כפילות ייבדק שוב ושוב

## מה ייבנה

### 1. Edge Function חדשה: `detect-duplicates`

תעטוף את ה-RPC `detect_duplicates_batch` עם:
- Self-triggering — רצה batch אחרי batch עד שנגמר, בדיוק כמו backfill
- ללא הגבלת batch (ה-RPC עצמו מגביל ל-500 per call, אבל ה-Edge Function ממשיכה לקרוא עד שאין עוד)
- דיווח progress לטבלת `backfill_progress` (task_name: `dedup-scan`)
- ריצה ראשונה על **כל** הנכסים (אקטיביים + לא-אקטיביים) — כי `dedup_checked_at IS NULL` לכולם

### 2. עדכון RPC: `detect_duplicates_batch`

- שינוי הפילטר מ-`duplicate_group_id IS NULL` ל-`dedup_checked_at IS NULL`
- הסרת הפילטר `is_active = true` כדי לכלול גם נכסים לא-אקטיביים
- אחרי בדיקת כל נכס — סימון `dedup_checked_at = now()` (גם אם לא נמצאה כפילות)
- כשנמצאת כפילות בין אקטיבי ללא-אקטיבי — מקשר אותם לאותה קבוצה

### 3. תיקון סטטיסטיקות בדשבורד

הסטטיסטיקות יקראו מ-`scouted_properties` במקום מ-`duplicate_alerts`:
- **נותרו** — `dedup_checked_at IS NULL` (כרגע 6,901)
- **קבוצות** — `COUNT(DISTINCT duplicate_group_id)` (כרגע 385)
- **Losers** — `is_primary_listing = false` (כרגע 204)
- **נבדקו היום** — `dedup_checked_at >= today`

### 4. איפוס בעדכון נכס

כשנכס מתעדכן (כתובת, מחיר, חדרים) — אוטומטית `dedup_checked_at = NULL` כדי שייבדק שוב. ייעשה ב-`saveProperty` (ב-_shared/property-helpers.ts).

## פרטים טכניים

### מיגרציה

עדכון `detect_duplicates_batch` RPC:
- החלפת `WHERE sp.duplicate_group_id IS NULL AND sp.is_active = true` ב-`WHERE sp.dedup_checked_at IS NULL`
- הוספת `UPDATE SET dedup_checked_at = now()` לכל נכס שנבדק (גם אם לא נמצאה כפילות)
- שמירת property_type filter

### Edge Function: `supabase/functions/detect-duplicates/index.ts`

```text
1. יצירת/עדכון רשומה ב-backfill_progress (task_name: 'dedup-scan')
2. קריאה ל-detect_duplicates_batch(500) ב-loop
3. אחרי כל batch — עדכון progress (processed, duplicates_found)
4. כשה-batch מחזיר 0 processed — סיום
5. אם יש עוד — self-trigger (קריאה עצמית)
```

### ChecksDashboard.tsx

החלפת שאילתת `dedup-stats-summary` מ-`duplicate_alerts` ל:
```text
- unchecked: COUNT WHERE dedup_checked_at IS NULL
- groups: COUNT(DISTINCT duplicate_group_id) WHERE duplicate_group_id IS NOT NULL
- losers: COUNT WHERE is_primary_listing = false AND duplicate_group_id IS NOT NULL
- checkedToday: COUNT WHERE dedup_checked_at >= today
```

מטריקות הכרטיס:
- "נותרו" = unchecked count
- "קבוצות" = duplicate groups
- "משניים" = losers count

### property-helpers.ts

ב-`saveProperty`, באזור ה-upsert — הוספת `dedup_checked_at: null` כדי שנכס חדש/מעודכן ייכנס לתור הבדיקה.

### קבצים שישתנו:
- מיגרציה חדשה (עדכון RPC)
- `supabase/functions/detect-duplicates/index.ts` (חדש)
- `src/components/scout/ChecksDashboard.tsx`
- `supabase/functions/_shared/property-helpers.ts`
- `src/integrations/supabase/types.ts`

### Deploy:
- detect-duplicates
