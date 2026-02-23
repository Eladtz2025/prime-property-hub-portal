

# תיקון מונה "נותרו" בבדיקת זמינות 2

## הבעיה

המונה "נותרו" תמיד מציג 1,000 כי PostgREST (שכבת ה-API של Supabase) מגביל תשובות RPC ל-1,000 שורות כברירת מחדל. הדשבורד קורא ל-RPC ואז סופר את אורך המערך (`recheckRes.data?.length`), אז הוא תמיד מקבל מקסימום 1,000.

המספר האמיתי כרגע הוא **2,545** נכסים שממתינים לבדיקה.

## התיקון

בקובץ `src/components/scout/ChecksDashboard.tsx`, שורות 151-156 — להחליף את קריאת ה-RPC בגישה שמבקשת רק את הספירה:

```typescript
// לפני (מוגבל ל-1000):
supabase.rpc('get_properties_needing_availability_check', {
  p_first_recheck_days: 8,
  p_recurring_recheck_days: 2,
  p_min_days_before_check: 3,
  p_fetch_limit: 10000
})

// אחרי (ספירה מדויקת):
supabase.rpc('get_properties_needing_availability_check', {
  p_first_recheck_days: 8,
  p_recurring_recheck_days: 2,
  p_min_days_before_check: 3,
  p_fetch_limit: 10000
}).select('id', { count: 'exact', head: true })
```

ובשורה 158 לשנות את הקריאה מ-`recheckRes.data?.length` ל-`recheckRes.count`:

```typescript
// לפני:
pendingRecheck: recheckRes.data?.length ?? 0

// אחרי:
pendingRecheck: recheckRes.count ?? 0
```

אותו תיקון גם בקובץ `src/pages/AdminPropertyScout.tsx` (שורות 43-48) שם יש את אותה קריאת RPC לסטטיסטיקות הגלובליות.

## סיכום

| קובץ | שינוי |
|---|---|
| `src/components/scout/ChecksDashboard.tsx` | שימוש ב-`count: 'exact', head: true` במקום `data.length` |
| `src/pages/AdminPropertyScout.tsx` | אותו תיקון לסטטיסטיקה הגלובלית |

