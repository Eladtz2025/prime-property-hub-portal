

## הסרת טאב Insights מהתפריטים

הסרה זמנית של הלינק לעמוד Insights מכל התפריטים. הנתיבים והעמודים עצמם יישארו קיימים (לא נמחק קוד) — רק נסיר את הלינקים מהניווט.

### שינויים (3 קבצים)

| קובץ | שינוי |
|-------|--------|
| `src/components/he/Header.tsx` | הסר שורה 41: `{ label: "תובנות", path: "/he/insights" }` |
| `src/components/en/Header.tsx` | הסר שורה 41: `{ label: "Insights", path: "/en/insights" }` |
| `src/components/EnhancedTopNavigation.tsx` | הסר שורה 35: `{ title: "תובנות", ... }` |

**הנתיבים, העמודים, והאדמין CRUD יישארו — רק הלינקים בתפריט יוסרו.**

