
# תיקון מונה "נותרו" בבדיקת זמינות 2 (Jina)

## הבעיה
לאחר התיקון הקודם שבו ניסיתי לעקוף את מגבלת 1,000 השורות על ידי שימוש ב-`count: 'exact'`, נראה שהמונה מציג "0" למרות שישנם נכסים הממתינים לבדיקה (שאילתת SQL מראה שישנם כ-2,504 נכסים כאלו).

הסיבה לכך היא שהשימוש ב-`.select('id', { count: 'exact', head: true })` לאחר קריאת ה-RPC אינו מחזיר את המאפיין `count` בצורה תקינה בספריית `supabase-js` בגרסה זו (הוא מחזיר גוף ריק או מערך, אך לא מעדכן את ה-header `Prefer: count=exact` בצורה הנכונה עבור קריאות POST ל-RPC).

## הפתרון
נעבור לשימוש בתחביר הסטנדרטי של `rpc` עבור קבלת ספירה בלבד: העברת האפשרויות כפרמטר שלישי לפונקציית ה-`rpc`. זה מבטיח שהספרייה תשלח את ה-header המתאים ותחזיר את ה-`count` בצורה נכונה.

## שלבי ביצוע

### 1. עדכון דשבורד הבדיקות (`src/components/scout/ChecksDashboard.tsx`)
נשנה את הקריאה ל-RPC בשורה 151 כך שתשתמש בפרמטר השלישי של אפשרויות (`options`) במקום שרשור `.select()`.

```typescript
// לפני:
(supabase.rpc('get_properties_needing_availability_check', { ... }) as any)
  .select('id', { count: 'exact', head: true })

// אחרי:
supabase.rpc('get_properties_needing_availability_check', {
  p_first_recheck_days: 8,
  p_recurring_recheck_days: 2,
  p_min_days_before_check: 3,
  p_fetch_limit: 10000
}, { count: 'exact', head: true })
```

### 2. עדכון עמוד ניהול סקאוט (`src/pages/AdminPropertyScout.tsx`)
נבצע את אותו התיקון גם בסטטיסטיקות הגלובליות שמוצגות בעמוד הניהול (שורות 39-44).

## תוצאה צפויה
המונה "נותרו" בבדיקת זמינות 2 יציג את המספר המדויק (בסביבות 2,504) במקום 0 או 1,000.
