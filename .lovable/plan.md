
## תיקון מונה "נותרו" בדשבורד בדיקות זמינות

### הבעיה
המונה "נותרו" בדשבורד מציג 269, אבל בפועל אין נכסים שממתינים לבדיקה. הסיבה: המונה משתמש בלוגיקה פשוטה (כל נכס אקטיבי שלא נבדק 7 ימים), בעוד שה-RPC האמיתי מסנן:
- כפילויות (duplicate losers) - 184 נכסים
- נכסים חדשים מדי (פחות מ-3 ימים) - 83 נכסים
- מרווחי בדיקה חוזרת שונים (8 ימים לבדיקה ראשונה, 2 ימים לחוזרת)

### הפתרון
עדכון השאילתה של `pendingRecheck` בקובץ `src/components/scout/ChecksDashboard.tsx` כך שתקרא ישירות ל-RPC `get_properties_needing_availability_check` במקום לבצע שאילתה פשוטה. כך המונה יציג את המספר האמיתי של נכסים שמחכים לבדיקה.

### פרטים טכניים

**קובץ שישתנה:** `src/components/scout/ChecksDashboard.tsx`

**שינוי בשורות 146-153:**
החלפת השאילתה של `recheckRes` (שורה 151) מ:
```
supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
  .eq('is_active', true)
  .or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`)
```

לקריאת RPC:
```
supabase.rpc('get_properties_needing_availability_check', {
  p_first_recheck_days: 8,
  p_recurring_recheck_days: 2,
  p_min_days_before_check: 3,
  p_fetch_limit: 10000
})
```

ואז הערך יהיה `recheckRes.data?.length ?? 0` במקום `recheckRes.count ?? 0`.

**אותו שינוי גם במונה הגלובלי** ב-`src/pages/AdminPropertyScout.tsx` (שורות 38-44) - אותה בעיה קיימת שם.

אין שינוי במסד נתונים - ה-RPC כבר קיים.
