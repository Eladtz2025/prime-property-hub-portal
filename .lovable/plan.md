
# תוכנית השבתת Personal Scout

## סיכום
השבתה מלאה של מערכת Personal Scout - הסרה מה-UI, עצירת הריצה האוטומטית, וארגון הקבצים בתיקייה נפרדת.

---

## שלב 1: הסרת הטאב מה-Admin UI

**קובץ:** `src/pages/AdminPropertyScout.tsx`

שינויים:
- הסרת הייבוא של `PersonalScoutTab`
- הסרת הייבוא של `UserSearch` icon
- שינוי ה-grid מ-4 עמודות ל-3 עמודות
- הסרת הטריגר והתוכן של "סקאוט אישי"

---

## שלב 2: עצירת ה-Cron Job האוטומטי

**פעולה:** מחיקת ה-cron job בשם `personal-scout-daily`

מה קיים כרגע:
- Job ID: 15
- שם: `personal-scout-daily`
- לוח זמנים: `0 23 * * *` (23:00 UTC = 01:00 IST)

**SQL למחיקה:**
```sql
SELECT cron.unschedule('personal-scout-daily');
```

---

## שלב 3: העברת קבצי Frontend לתיקייה נפרדת

**קבצים להעברה:**
| מיקום נוכחי | מיקום חדש |
|-------------|-----------|
| `src/components/scout/PersonalScoutTab.tsx` | `src/components/_archived/personal-scout/PersonalScoutTab.tsx` |
| `src/components/scout/PersonalScoutMatchesDialog.tsx` | `src/components/_archived/personal-scout/PersonalScoutMatchesDialog.tsx` |

---

## שלב 4: העברת Edge Functions לתיקייה נפרדת

**קבצים להעברה:**
| מיקום נוכחי | מיקום חדש |
|-------------|-----------|
| `supabase/functions/personal-scout-trigger/` | `supabase/functions/_archived/personal-scout-trigger/` |
| `supabase/functions/personal-scout-worker/` | `supabase/functions/_archived/personal-scout-worker/` |
| `supabase/functions/_personal-scout/` | `supabase/functions/_archived/_personal-scout/` |

**הערה:** תיקיות שמתחילות ב-`_` לא מתפרסות כ-Edge Functions.

---

## שלב 5: מחיקת Edge Functions שפורסמו

**פעולה:** מחיקת הפונקציות מ-Supabase:
- `personal-scout-trigger`
- `personal-scout-worker`

---

## סיכום פעולות

| # | פעולה | סוג |
|---|-------|-----|
| 1 | הסרת טאב "סקאוט אישי" מ-AdminPropertyScout | עריכת קוד |
| 2 | מחיקת cron job `personal-scout-daily` | SQL |
| 3 | העברת 2 קומפוננטות React לתיקיית ארכיון | העברת קבצים |
| 4 | העברת 2 Edge Functions + תיקיית shared לארכיון | העברת קבצים |
| 5 | מחיקת Edge Functions שפורסמו | Supabase API |

**הערה חשובה:** הטבלאות `personal_scout_runs` ו-`personal_scout_matches` יישארו בDB עם הנתונים הקיימים. אם תרצה למחוק אותן בעתיד - נעשה את זה בנפרד.

---

## פרטים טכניים

### מבנה חדש של התיקיות
```text
src/components/_archived/
  personal-scout/
    PersonalScoutTab.tsx
    PersonalScoutMatchesDialog.tsx

supabase/functions/_archived/
  personal-scout-trigger/
    index.ts
  personal-scout-worker/
    index.ts
  _personal-scout/
    feature-filter.ts
    neighborhood-codes.ts
    pagination.ts
    parser-homeless.ts
    parser-madlan.ts
    parser-utils.ts
    parser-yad2.ts
    scraping.ts
    url-builder.ts
```

### AdminPropertyScout אחרי השינוי
הדף יישאר עם 3 טאבים בלבד:
1. דירות שנמצאו (properties)
2. הגדרות (settings)
3. היסטוריית ריצות (history)
