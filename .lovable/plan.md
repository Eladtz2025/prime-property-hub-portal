

# תיקון נתונים בדף סקאוט נדל"ן

## הבעיה המרכזית

יש **התנגשות ב-queryKey** בין `AdminPropertyScout.tsx` ל-`ChecksDashboard.tsx` -- שניהם משתמשים ב-`queryKey: ['availability-stats']` אבל מחזירים **מבנה נתונים שונה**:

- **AdminPropertyScout** מחזיר: `{ total, pending, checkedToday, totalActive }`
- **ChecksDashboard** מחזיר: `{ pending, checkedToday, timeouts, totalActive, pendingRecheck }`

כש-React Query שומר את התוצאה של אחד, הוא דורס את השני. לכן "סה״כ נכסים" מציג "—" (כי ChecksDashboard דורס את ה-cache בלי שדה `total`).

## כל הבעיות שזוהו

| בעיה | מצב נוכחי | מצב נכון |
|------|----------|----------|
| סה״כ נכסים | מציג "—" | צריך להציג 6,901 |
| ממתינים לבדיקה (כרטיס עליון) | 708 (רק לא נבדקו מעולם) | צריך להתאים ל"נותרו" בכרטיסית הזמינות (2,234) |
| שאילתות כפולות | שני קומפוננטים עם אותו queryKey | לאחד לשאילתה אחת |

## הפתרון

### שלב 1: איחוד השאילתות

נעביר את **כל** שאילתות הסטטיסטיקה הגלובליות לשאילתה אחת ב-`AdminPropertyScout.tsx` עם queryKey ייחודי (`['global-scout-stats']`), שתחזיר את כל הנתונים שצריך גם לכרטיסים העליונים וגם ל-ChecksDashboard.

### שלב 2: תיקון AdminPropertyScout.tsx

- שינוי ה-queryKey ל-`['global-scout-stats']`
- הוספת שדה `total` (סה"כ נכסים) לשאילתה
- שינוי "ממתינים לבדיקה" כך שיציג את הספירה הנכונה (כולל recheck) במקום רק "לא נבדקו מעולם"
- העברת נתוני stats כ-props ל-ChecksDashboard כדי למנוע שאילתות כפולות

### שלב 3: תיקון ChecksDashboard.tsx

- הסרת שאילתת `availability-stats` הכפולה
- קבלת הנתונים כ-props מהדף הראשי, או שימוש ב-queryKey שונה
- וידוא שהנתונים בכרטיסיות התהליך תואמים לכרטיסים העליונים

## פרטים טכניים

### AdminPropertyScout.tsx

החלפת השאילתה הקיימת בשאילתה מאוחדת:

```typescript
const { data: stats } = useQuery({
  queryKey: ['global-scout-stats'],
  queryFn: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recheckCutoff = new Date();
    recheckCutoff.setDate(recheckCutoff.getDate() - 7);
    const [totalRes, totalActiveRes, pendingRecheckRes, checkedTodayRes] = await Promise.all([
      supabase.from('scouted_properties').select('id', { count: 'exact', head: true }),
      supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`availability_checked_at.is.null,availability_checked_at.lt.${recheckCutoff.toISOString()}`),
      supabase.from('scouted_properties').select('id', { count: 'exact', head: true })
        .gte('availability_checked_at', today.toISOString()),
    ]);
    return {
      total: totalRes.count ?? 0,
      totalActive: totalActiveRes.count ?? 0,
      pendingRecheck: pendingRecheckRes.count ?? 0,
      checkedToday: checkedTodayRes.count ?? 0,
    };
  },
  refetchInterval: 15000,
});
```

הכרטיסים העליונים ישתנו:
- "ממתינים לבדיקה" -> ישתמש ב-`stats.pendingRecheck` (2,234 במקום 708)

### ChecksDashboard.tsx

החלפת שאילתת `availability-stats` ל-queryKey `['dashboard-availability-stats']` כדי למנוע התנגשות, או שימוש ב-`['global-scout-stats']` ושליפה משם.

השאילתה הפנימית תישאר עם הפרטים הנוספים (timeouts וכו') אבל עם queryKey שונה:

```typescript
queryKey: ['dashboard-availability-detail']
```

### קבצים שישתנו:
- `src/pages/AdminPropertyScout.tsx`
- `src/components/scout/ChecksDashboard.tsx`
